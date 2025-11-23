import { Injectable } from "@nestjs/common";
import { WebhookEvent } from "@prisma/client";
import { WebhooksService } from "./webhooks.service";
import prisma from '@/prisma/prisma.service';

@Injectable()
export class WebhookDispatcherService {
    constructor(private readonly webhookService: WebhooksService) { }

    async dispatch(event: WebhookEvent, payload: any) {
        // Try to determine companyId from payload
        const companyId = payload?.company?.id || payload?.companyId || null;

        const where: any = { events: { has: event } };
        if (companyId) where.companyId = companyId;

        const webhooks = await prisma.webhook.findMany({ where });

        await this.webhookService.send(webhooks, event, payload);
    }
}
