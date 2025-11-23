import { WebhookDriver } from "./webhook-driver.interface";
import { WebhookType } from "@prisma/client";

export class SlackDriver implements WebhookDriver {
    supports(type: WebhookType) {
        return type === WebhookType.SLACK;
    }

    async send(url: string, payload: any): Promise<boolean> {
        const body = {
            text: payload.text || payload.message || JSON.stringify(payload),
            blocks: payload.blocks,
        };

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        return res.ok;
    }
}
