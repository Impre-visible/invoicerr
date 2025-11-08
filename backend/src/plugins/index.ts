import { existsSync, readFileSync } from 'fs';

// Import all providers manually
import { DocumensoProvider } from './signing/providers/documenso/documenso';
import { IPluginForm } from './signing/types';
import { PluginType } from '@prisma/client';
import { join } from 'path';
import prisma from '@/prisma/prisma.service';

export class PluginRegistry {
    private static instance: PluginRegistry;
    private readonly inAppPluginTypes = new Map<string, Map<string, any>>();
    private readonly providersMap = new Map<string, any>(); // Store actual provider instances
    private static isInitialized = false;
    private static initializationPromise: Promise<void> | null = null;

    private constructor() {
        // Ne pas initialiser ici car on a besoin de PrismaService
    }

    static getInstance(): PluginRegistry {
        if (!PluginRegistry.instance) {
            PluginRegistry.instance = new PluginRegistry();
        }
        return PluginRegistry.instance;
    }

    async initializeIfNeeded(): Promise<void> {
        if (PluginRegistry.isInitialized) {
            return;
        }

        // Si une initialisation est déjà en cours, attendre qu'elle se termine
        if (PluginRegistry.initializationPromise) {
            await PluginRegistry.initializationPromise;
            return;
        }

        // Démarrer l'initialisation
        PluginRegistry.initializationPromise = this.doInitialization();
        await PluginRegistry.initializationPromise;
    }

    private async doInitialization(): Promise<void> {
        if (PluginRegistry.isInitialized) {
            return;
        }

        this.initializeInAppPlugins();
        await this.syncWithDatabase();
        PluginRegistry.isInitialized = true;
        PluginRegistry.initializationPromise = null;
    }

    private initializeInAppPlugins() {
        // Register signing providers
        this.registerProvider('signing', DocumensoProvider);
    }

    private registerProvider(type: string, provider: any) {
        if (!this.inAppPluginTypes.has(type)) {
            this.inAppPluginTypes.set(type, new Map());
        }

        if (provider && provider.id) {
            const form = provider.form || {};
            this.inAppPluginTypes.get(type)!.set(provider.id, form);
            this.providersMap.set(provider.id, provider);
            console.log(`Registered ${type} provider: ${provider.id}`);
        }
    }

    private async syncWithDatabase(): Promise<void> {
        for (const [type, providers] of this.inAppPluginTypes) {
            const pluginType = this.getPluginTypeEnum(type);

            for (const [providerId, form] of providers) {
                // Vérifier si le plugin existe déjà dans la DB par ID
                const existingPlugin = await prisma.plugin.findUnique({
                    where: {
                        id: providerId
                    }
                });

                if (!existingPlugin) {
                    // Créer le plugin dans la DB
                    await prisma.plugin.create({
                        data: {
                            id: providerId,
                            name: this.providersMap.get(providerId)?.name || providerId,
                            type: pluginType,
                            config: {},
                            isActive: false
                        }
                    });
                    console.log(`Synced ${type} provider "${providerId}" to database`);
                } else {
                    console.log(`Plugin "${providerId}" already exists in database`);
                }
            }
        }
    }

    private getPluginTypeEnum(type: string): PluginType {
        switch (type.toLowerCase()) {
            case 'signing':
                return PluginType.SIGNING;
            case 'pdf_format':
                return PluginType.PDF_FORMAT;
            case 'payment':
                return PluginType.PAYMENT;
            case 'oidc':
                return PluginType.OIDC;
            default:
                throw new Error(`Unknown plugin type: ${type}`);
        }
    }

    async getProvider<T>(type: string): Promise<T | null> {
        await this.initializeIfNeeded();

        const pluginType = this.getPluginTypeEnum(type);

        // Chercher le plugin actif dans la DB
        const activePlugin = await prisma.plugin.findFirst({
            where: {
                type: pluginType,
                isActive: true
            }
        });

        if (!activePlugin) {
            return null;
        }

        // Retourner l'instance du provider
        return this.providersMap.get(activePlugin.id) as T || null;
    }

    public async getProviderForm(plugin_id: string): Promise<IPluginForm> {
        // Get the path to the provider form based on plugin_id
        let path: string = "";
        for (const [type, providers] of this.inAppPluginTypes) {
            if (providers.has(plugin_id)) {
                path = join(process.cwd(), 'src', 'plugins', type.toLowerCase(), 'providers', plugin_id, `${plugin_id}-form.json`);
                break;
            }
        }
        if (!path || !existsSync(path)) {
            await prisma.plugin.delete({where: {id: plugin_id}});
            throw new Error(`Form for plugin ID "${plugin_id}" not found.`);
        }

        const content = JSON.parse(readFileSync(path, 'utf-8')) as IPluginForm;
        return content;
    }
}
