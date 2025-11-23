import { Controller, Post, Param, Body, Req, Res, Logger, HttpException, HttpStatus, Get, Delete, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AllowAnonymous } from '@/decorators/allow-anonymous.decorator';
import { WebhooksService } from './webhooks.service';
import prisma from '@/prisma/prisma.service';
import { LoginRequiredGuard } from '@/guards/login-required.guard';
import crypto from 'crypto';

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

    // Protected CRUD endpoints for managing webhooks (company-scoped)
    @Get()
    @UseGuards(LoginRequiredGuard)
    async list() {
        const company = await prisma.company.findFirst();
        if (!company) return [];

        const webhooks = await prisma.webhook.findMany({ where: { companyId: company.id } });

        // Remove secret from response
        return webhooks.map(w => ({ ...w, secret: undefined }));
    }

    @Post()
    @UseGuards(LoginRequiredGuard)
    async create(@Body() body: any) {
        const company = await prisma.company.findFirst();
        if (!company) throw new HttpException('No company found', HttpStatus.BAD_REQUEST);

        const secret = body.secret ?? crypto.randomBytes(20).toString('hex');

        const created = await prisma.webhook.create({
            data: {
                url: body.url,
                type: body.type ?? 'GENERIC',
                events: body.events ?? [],
                secret,
                companyId: company.id,
            }
        });

        // Return the secret only once
        return { success: true, data: { ...created, secret } };
    }

    @Delete(':id')
    @UseGuards(LoginRequiredGuard)
    async remove(@Param('id') id: string) {
        const existing = await prisma.webhook.findUnique({ where: { id } });
        if (!existing) throw new HttpException('Webhook not found', HttpStatus.NOT_FOUND);

        const company = await prisma.company.findFirst();
        if (!company || existing.companyId !== company.id) throw new HttpException('Webhook not found', HttpStatus.NOT_FOUND);

        await prisma.webhook.delete({ where: { id } });

        return { success: true };
    }
}
