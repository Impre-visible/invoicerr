import { Injectable, Logger } from "@nestjs/common";

import { WebhookEvent } from "../../../prisma/generated/prisma/client";
import { WebhooksService } from "./webhooks.service";
import prisma from '@/prisma/prisma.service';

@Injectable()
export class WebhookDispatcherService {
    private readonly logger = new Logger(WebhookDispatcherService.name);

    constructor(private readonly webhookService: WebhooksService) { }

    async dispatch(event: WebhookEvent, payload: any) {
        this.logger.log(`Dispatching webhook event: ${event}`);
        const companyId = payload?.company?.id || payload?.companyId || null;

        const where: any = { events: { has: event } };
        if (companyId) where.companyId = companyId;

        const webhooks = await prisma.webhook.findMany({ where });

        await this.webhookService.send(webhooks, event, payload);
    }
}
