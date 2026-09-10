import { WEBHOOK_FETCH_TIMEOUT_MS, WebhookDriver } from './webhook-driver.interface';
import { WebhookType } from '../../../../prisma/generated/prisma/client';

export class ZapierDriver implements WebhookDriver {
  supports(type: WebhookType) {
    return type === WebhookType.ZAPIER;
  }

  async send(url: string, payload: any): Promise<boolean> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'manual',
      signal: AbortSignal.timeout(WEBHOOK_FETCH_TIMEOUT_MS),
    });

    return res.ok;
  }
}
