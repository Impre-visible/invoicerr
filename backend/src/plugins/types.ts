import { Request } from 'express';

export interface IPlugin {
  id: string;
  name: string;
}

/**
 * Interface for providers that can validate plugins
 */
export interface IValidatableProvider {
  /**
   * Validates the plugin and configures the necessary webhooks
   * @param pluginId The ID of the plugin
   * @param webhookUrl The generated webhook URL
   * @param config The plugin configuration
   */
  validatePlugin?(pluginId: string, webhookUrl: string, config: any): Promise<void>;
}

/**
 * Interface for providers that support webhooks
 */
export interface IWebhookProvider {
  /**
   * Handles a received webhook
   * @param req The Express Request object
   * @param body The body of the webhook request
   */
  handleWebhook(req: Request, body: any): Promise<any>;
}

/**
 * Interface for providers that support pdf preview
 */
export interface IPdfPreviewProvider {
  /**
   * Generates a preview for a PDF document
   * @param req The Express Request object
   * @param document The PDF document to preview
   */
  generatePdfPreview(quoteId: string): Promise<Uint8Array<ArrayBufferLike>>;
} 