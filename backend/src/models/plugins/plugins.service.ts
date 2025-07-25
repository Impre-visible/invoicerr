import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readdirSync, statSync } from 'fs';
import { extname, join } from 'path';

import { EInvoice } from '@fin.cx/einvoice';
import { randomUUID } from 'crypto';
import { simpleGit } from 'simple-git';

export interface PdfFormatInfo {
  format_name: string;
  format_key: string;
}

export interface Plugin {
  __uuid: string;
  __filepath: string;
  name: string;
  description: string;
  init?: () => void;
  pdf_format_info: () => PdfFormatInfo;
  pdf_format: (invoice: EInvoice) => Promise<string>;
}

const PLUGIN_DIR = process.env.PLUGIN_DIR || '/home/impre/invoicerr-plugins';

@Injectable()
export class PluginsService {
  private readonly logger = new Logger(PluginsService.name);
  private readonly plugins: Plugin[] = [];

  constructor() {
    this.logger.log('Loading plugins...');
    this.loadExistingPlugins();
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
    if (!existsSync(PLUGIN_DIR)) {
      this.logger.warn(`Plugin directory "${PLUGIN_DIR}" does not exist.`);
      return;
    }

    const dirs = readdirSync(PLUGIN_DIR).filter((f) =>
      statSync(join(PLUGIN_DIR, f)).isDirectory()
    );

    for (const dir of dirs) {
      try {
        await this.loadPluginFromPath(join(PLUGIN_DIR, dir));
      } catch (err) {
        this.logger.error(`Failed to load plugin "${dir}": ${err.message}`);
      }
    }
  }

  async loadPluginFromPath(pluginPath: string): Promise<Plugin> {
    if (pluginPath.startsWith('http')) {
      pluginPath = await this.cloneRepo(pluginPath, pluginPath.split('/').pop() || 'unknown-plugin');
    }
    const files = readdirSync(pluginPath);
    const jsFile = files.find((f) => extname(f) === '.js');

    if (!jsFile) {
      throw new Error(`No .js file found in plugin directory: ${pluginPath}`);
    }

    const pluginFile = join(pluginPath, jsFile);
    const pluginModule = await import(pluginFile);
    const PluginClass = pluginModule.default;

    const plugin: Plugin = new PluginClass();

    plugin.init?.();
    let uuid = randomUUID();
    while (this.plugins.some((p) => p.__uuid === uuid)) {
      uuid = randomUUID();
    }
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

  getPlugins(): Plugin[] {
    return this.plugins;
  }

  getFormats(): PdfFormatInfo[] {
    return this.plugins.map((p) => p.pdf_format_info());
  }

  canGenerateXml(formatKey: string): boolean {
    const plugin = this.plugins.find((p) => p.pdf_format_info().format_key === formatKey);
    return !!plugin;
  }

  async generateXml(formatKey: string, invoice: EInvoice): Promise<string> {
    const plugin = this.plugins.find((p) => p.pdf_format_info().format_key === formatKey);
    if (!plugin) {
      this.logger.warn(`No plugin found for format_key="${formatKey}"`);
      throw new Error(`No plugin found for format_key="${formatKey}"`);
    }
    return await plugin.pdf_format(invoice);
  }
}
