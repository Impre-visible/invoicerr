import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { existsSync, readdirSync, rmSync, statSync } from 'fs';
import { extname, join } from 'path';

import { EInvoice } from '@fin.cx/einvoice';
import { PluginRegistry } from '../../plugins';
import prisma from '@/prisma/prisma.service';
import { randomUUID } from 'crypto';
import { simpleGit } from 'simple-git';

export interface PdfFormatInfo {
  format_name: string;
  format_key: string;
}

export interface IPlugin {
  __uuid: string;
  __filepath: string;
  name: string;
  description: string;
  init?: () => void;
  config?: any;
  type?: string;
  isActive?: boolean;
}

export interface InvoicePlugin extends IPlugin {
  pdf_format_info: () => PdfFormatInfo;
  pdf_format: (invoice: EInvoice) => Promise<string>;
}

const PLUGIN_DIR = process.env.PLUGIN_DIR || '/root/invoicerr-plugins';
const PLUGIN_DIRS = [PLUGIN_DIR, join(process.cwd(), 'src', 'in-app-plugins')];

@Injectable()
export class PluginsService {
  private readonly logger = new Logger(PluginsService.name);
  private readonly plugins: IPlugin[] = [];
  private pluginRegistry = PluginRegistry.getInstance();
  private static isInitialized = false;

  constructor() {
    if (!PluginsService.isInitialized) {
      this.logger.log('Loading plugins...');
      this.loadExistingPlugins();
      // Initialiser le registry et synchroniser avec la DB
      this.pluginRegistry.initializeIfNeeded().catch(err => {
        this.logger.error('Failed to initialize plugin registry:', err);
      });
      PluginsService.isInitialized = true;
    }
  }

  async cloneRepo(gitUrl: string, name: string): Promise<string> {
    const pluginPath = join(PLUGIN_DIR, name);

    if (!existsSync(pluginPath)) {
      this.logger.log(`Cloning plugin "${name}" from ${gitUrl}...`);
      await simpleGit().clone(gitUrl, pluginPath);
    }

    return pluginPath;
  }


  async loadExistingPlugins(): Promise<void> {
    for (const pluginDir of PLUGIN_DIRS) {
      console.log(`Loading plugins from directory: ${pluginDir}`);
      if (!existsSync(pluginDir)) {
        this.logger.warn(`Plugin directory "${pluginDir}" does not exist.`);
        return;
      }

      const dirs = readdirSync(pluginDir).filter((f) =>
        statSync(join(pluginDir, f)).isDirectory()
      );

      for (const dir of dirs) {
        try {
          await this.loadPluginFromPath(join(pluginDir, dir));
        } catch (err) {
          this.logger.error(`Failed to load plugin "${dir}": ${err.message}`);
        }
      }
    }
  }

  async loadPluginFromPath(pluginPath: string): Promise<IPlugin> {
    if (pluginPath.startsWith('http')) {
      pluginPath = await this.cloneRepo(pluginPath, pluginPath.split('/').pop() || `unknown-plugin-${Date.now()}`);
    }
    const files = readdirSync(pluginPath);
    const jsFile = files.find((f) => extname(f) === '.js');

    if (!jsFile) {
      throw new Error(`No .js file found in plugin directory: ${pluginPath}`);
    }

    const pluginFile = join(pluginPath, jsFile);
    const pluginModule = await import(pluginFile);
    const PluginClass = pluginModule.default;

    const plugin: IPlugin = new PluginClass();

    plugin.init?.();
    let uuid = randomUUID();
    while (this.plugins.some((p) => p.__uuid === uuid)) {
      uuid = randomUUID();
    }
    plugin.__uuid = uuid;
    plugin.__filepath = pluginFile;

    this.plugins.push(plugin);
    this.logger.log(`Plugin "${plugin.name}" loaded.`);

    return plugin;
  }

  async loadAllPlugins(pluginConfigs: { git: string; name: string }[]) {
    for (const config of pluginConfigs) {
      try {
        const path = await this.cloneRepo(config.git, config.name);
        await this.loadPluginFromPath(path);
      } catch (err) {
        this.logger.error(`Failed to load plugin "${config.name}": ${err.message}`);
      }
    }
  }

  getPlugins(): IPlugin[] {
    return this.plugins;
  }

  async getInAppPlugins(): Promise<{ category: string, plugins: { name: string, isActive: boolean }[] }[]> {
    const categories = await prisma.plugin.findMany({
      select: { type: true },
      distinct: ['type'],
    });

    const result: { category: string, plugins: { id: string, name: string, isActive: boolean }[] }[] = [];

    for (const category of categories) {
      const pluginsInCategory = await prisma.plugin.findMany({
        where: { type: category.type },
        select: { name: true, isActive: true, id: true },
      });

      const title = category.type.toLowerCase()

      result.push({
        category: title.charAt(0).toUpperCase() + title.slice(1),
        plugins: pluginsInCategory.map(p => ({ id: p.id, name: p.name, isActive: p.isActive })),
      });
    }

    return result;
  }

  async toggleInAppPlugin(id: string) {
    const plugin = await prisma.plugin.findFirst({
      where: { id },
    });

    if (!plugin) {
      throw new Error(`Plugin with id "${id}" not found`);
    }

    // If plugin is already active, deactivate it
    if (plugin.isActive) {
      await prisma.plugin.update({
        where: { id },
        data: { isActive: false }
      });

      this.logger.log(`Plugin "${plugin.name}" is now inactive.`);
      return { success: true };
    }

    // If plugin is not active, check if another plugin of the same type is active
    const existingActivePlugin = await prisma.plugin.findFirst({
      where: {
        type: plugin.type,
        isActive: true,
        id: { not: plugin.id }
      },
    });

    if (existingActivePlugin) {
      throw new BadRequestException(`Another plugin "${existingActivePlugin.name}" is already active for category "${plugin.type}". Please disable it first.`);
    }

    // Check if the plugin requires configuration
    const formConfig = await this.pluginRegistry.getProviderForm(plugin.id);

    if (formConfig && Object.keys(formConfig).length > 0) {
      return {
        requiresConfiguration: true,
        formConfig: formConfig,
        currentConfig: plugin.config || {}
      };
    }

    // Activate the plugin if no configuration is required
    await prisma.plugin.update({
      where: { id },
      data: { isActive: true }
    });

    this.logger.log(`Plugin "${plugin.name}" is now active.`);
    return { success: true };
  }

  async configureInAppPlugin(id: string, config: Record<string, any>) {
    const plugin = await prisma.plugin.findFirst({
      where: { id },
    });

    if (!plugin) {
      throw new Error(`Plugin with id "${id}" not found`);
    }

    // Vérifier qu'aucun autre plugin du même type n'est actif
    const existingActivePlugin = await prisma.plugin.findFirst({
      where: {
        type: plugin.type,
        isActive: true,
        id: { not: plugin.id }
      },
    });

    if (existingActivePlugin) {
      throw new BadRequestException(`Another plugin "${existingActivePlugin.name}" is already active for category "${plugin.type}". Please disable it first.`);
    }

    // Mettre à jour la configuration et activer le plugin
    await prisma.plugin.update({
      where: { id },
      data: {
        config: config,
        isActive: true
      }
    });

    this.logger.log(`Plugin "${plugin.name}" configured and activated.`);
    return { success: true };
  }

  async getActivePlugin(type: string): Promise<IPlugin | null> {
    // Utiliser le registry pour obtenir le provider actif
    const provider = await this.pluginRegistry.getProvider(type);

    if (!provider) {
      return null;
    }

    // Récupérer les informations du plugin depuis la DB pour la config
    const pluginType = this.getPluginTypeEnum(type);
    const activePlugin = await prisma.plugin.findFirst({
      where: {
        type: pluginType as any,
        isActive: true,
      },
    });

    if (!activePlugin) {
      return null;
    }

    // Créer un objet IPlugin compatible avec le provider chargé
    const inAppPlugin: IPlugin = {
      __uuid: activePlugin.id,
      __filepath: '', // Pas de fichier physique pour les plugins intégrés
      name: activePlugin.name,
      description: `Plugin ${activePlugin.name} de type ${activePlugin.type}`,
      config: activePlugin.config,
      type: activePlugin.type,
      isActive: activePlugin.isActive,
      // Ajouter les méthodes du provider
      ...provider
    };

    return inAppPlugin;
  }

  /**
   * Obtenir le provider actif pour un type donné
   * @param type Le type de plugin (signing, payment, etc.)
   * @returns Le provider actif ou null
   */
  async getProvider<T = IPlugin>(type: string): Promise<T | null> {
    return await this.pluginRegistry.getProvider<T>(type);
  }

  private getPluginTypeEnum(type: string): string {
    switch (type.toLowerCase()) {
      case 'signing':
        return 'SIGNING';
      case 'pdf_format':
        return 'PDF_FORMAT';
      case 'payment':
        return 'PAYMENT';
      case 'oidc':
        return 'OIDC';
      default:
        throw new Error(`Unknown plugin type: ${type}`);
    }
  }

  canGenerateXml(format: string): boolean {
    // Vérifier si un plugin peut générer du XML pour ce format
    // Pour l'instant, retourner false car cette fonctionnalité n'est pas encore implémentée
    return false;
  }

  async generateXml(format: string, xmlInvoice: any): Promise<string> {
    // Générer du XML en utilisant un plugin
    // Pour l'instant, lancer une erreur car cette fonctionnalité n'est pas encore implémentée
    throw new Error(`XML generation for format "${format}" not implemented yet`);
  }

  getFormats(): any[] {
    // Retourner les formats disponibles depuis les plugins
    // Pour l'instant, retourner un tableau vide
    return [];
  }

  async deletePlugin(uuid: string): Promise<boolean> {
    const index = this.plugins.findIndex((p) => p.__uuid === uuid);
    if (index === -1) {
      throw new Error(`Plugin with UUID "${uuid}" not found`);
    }
    const plugin = this.plugins[index];
    this.plugins.splice(index, 1);
    if (existsSync(plugin.__filepath)) {
      let pluginDir = plugin.__filepath;
      pluginDir = join(pluginDir, '..');
      this.logger.log(`Deleting plugin files at ${pluginDir}`);
      rmSync(pluginDir, { recursive: true, force: true });
    }
    this.logger.log(`Plugin "${plugin.name}" deleted.`);

    return true
  }
}
