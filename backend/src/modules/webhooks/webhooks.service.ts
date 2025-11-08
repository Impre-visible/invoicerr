import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { IWebhookProvider } from '@/plugins/types';
import { PluginsService } from '../plugins/plugins.service';
import { Request } from 'express';
import prisma from '@/prisma/prisma.service';
import { verifyWebhookSecret } from '@/utils/webhook-security';

@Injectable()
export class WebhooksService {
    private readonly logger = new Logger(WebhooksService.name);

    constructor(private readonly pluginsService: PluginsService) { }

    /**
     * Traite un webhook reçu pour un plugin spécifique
     */
    async handlePluginWebhook(pluginId: string, body: any, req: Request): Promise<any> {
        this.logger.log(`Processing webhook for plugin: ${pluginId}`);

        // Vérifier que le plugin existe et est actif
        const plugin = await prisma.plugin.findFirst({
            where: {
                id: pluginId,
                isActive: true,
                webhookUrl: {
                    not: null
                }
            }
        });

        if (!plugin) {
            throw new NotFoundException(`Active plugin with UUID ${pluginId} not found or has no webhook configured`);
        }

        this.logger.log(`Found plugin: ${plugin.name} (${plugin.type})`);

        // Récupérer le provider du plugin
        const provider = await this.pluginsService.getProvider<IWebhookProvider>(plugin.type.toLowerCase());

        if (!provider) {
            throw new NotFoundException(`No provider found for plugin type: ${plugin.type}`);
        }

        // Vérifier que le provider a une méthode handleWebhook
        if (typeof provider.handleWebhook !== 'function') {
            this.logger.warn(`Provider for plugin ${plugin.name} does not implement handleWebhook method`);
            return { message: 'Webhook received but not handled by provider' };
        }

        // Appeler la méthode handleWebhook du provider
        try {
            const result = await provider.handleWebhook(req, body);
            this.logger.log(`Webhook processed successfully for plugin ${plugin.name}`);
            return result;
        } catch (error) {
            this.logger.error(`Error in provider webhook handler for plugin ${plugin.name}:`, error);
            throw error;
        }
    }

    /**
     * Génère une URL de webhook pour un plugin donné
     */
    generateWebhookUrl(pluginId: string): string {
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        return `${baseUrl}/api/webhooks/${pluginId}`;
    }

    /**
     * Extrait le secret webhook de la requête
     * Supporte plusieurs méthodes communes d'envoi de secrets
     */
    private extractSecretFromRequest(req: Request): string | null {
        // Vérifier les headers communs pour les secrets de webhook
        const authHeader = req.headers.authorization;
        const secretHeader = req.headers['x-webhook-secret'] as string;
        const signatureHeader = req.headers['x-signature'] as string;

        // Méthode 1: Header Authorization Bearer
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        // Méthode 2: Header X-Webhook-Secret
        if (secretHeader) {
            return secretHeader;
        }

        // Méthode 3: Header X-Signature
        if (signatureHeader) {
            return signatureHeader;
        }

        // Méthode 4: Query parameter
        if (req.query.secret) {
            return req.query.secret as string;
        }

        // Méthode 5: Dans le body (certains providers)
        if (req.body && req.body.webhook_secret) {
            return req.body.webhook_secret;
        }

        return null;
    }
}
