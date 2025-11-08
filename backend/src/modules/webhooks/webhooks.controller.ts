import { Controller, Post, Param, Body, Req, Res, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { AllowAnonymous } from '@/decorators/allow-anonymous.decorator';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

    constructor(private readonly webhooksService: WebhooksService) { }

    @Post(':uuid')
    @AllowAnonymous()
    async handleWebhook(
        @Param('uuid') uuid: string,
        @Body() body: any,
        @Req() req: Request,
        @Res() res: Response
    ) {
        try {
            const result = await this.webhooksService.handlePluginWebhook(uuid, body, req);

            return res.status(200).json({
                success: true,
                message: 'Webhook processed successfully',
                data: result
            });
        } catch (error) {
            this.logger.error(`Error processing webhook for plugin ${uuid}:`, error);

            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Webhook processing failed',
                error: error.message
            });
        }
    }
}
