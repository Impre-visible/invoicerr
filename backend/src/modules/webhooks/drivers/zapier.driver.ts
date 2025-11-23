import { WebhookDriver } from "./webhook-driver.interface";
import { WebhookType } from "@prisma/client";

export class ZapierDriver implements WebhookDriver {
    supports(type: WebhookType) {
        return type === WebhookType.ZAPIER;
    }

    async send(url: string, payload: any): Promise<boolean> {
        // Zapier attend généralement un POST JSON
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        return res.ok;
    }
}
