import { WebhookType } from '../../../../prisma/generated/prisma/client';

export interface WebhookDriver {
  supports(type: WebhookType): boolean;
  send(url: string, payload: any, secret?: string | null): Promise<boolean>;
}

/**
 * Outbound-fetch hardening shared by every driver that owns its own `fetch()` call —
 * SECURITY_AUDIT.md finding #2 (SSRF). The target URL is validated before the send is ever attempted
 * (`webhook-url-guard.ts`, re-run in `webhooks.service.ts#send` right before each dispatch), but a
 * malicious or compromised endpoint could otherwise answer with a 30x that redirects the *same*
 * request to an internal address and bypass that check entirely — so redirects are never followed
 * automatically. A bounded timeout keeps one unresponsive endpoint from hanging a whole dispatch.
 */
export const WEBHOOK_FETCH_TIMEOUT_MS = 10_000;
