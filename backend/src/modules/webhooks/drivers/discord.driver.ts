import { WebhookDriver } from "./webhook-driver.interface";
import { WebhookType } from "@prisma/client";

export class DiscordDriver implements WebhookDriver {
    supports(type: WebhookType) {
        return type === WebhookType.DISCORD;
    }

    async send(url: string, payload: any): Promise<boolean> {
        const body = {
            content: payload.text || payload.message || JSON.stringify(payload)
        };

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        return res.ok;
    }
}
