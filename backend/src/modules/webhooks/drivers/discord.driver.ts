import { EVENT_STYLES, formatPayloadForEvent } from './event-formatters';
import { Embed, Webhook } from '@teever/ez-hook';
import { WebhookEvent, WebhookType } from '../../../../prisma/generated/prisma/client';

import { WEBHOOK_FETCH_TIMEOUT_MS, WebhookDriver } from './webhook-driver.interface';

export class DiscordDriver implements WebhookDriver {
  supports(type: WebhookType) {
    return type === WebhookType.DISCORD;
  }

  async send(url: string, payload: any): Promise<boolean> {
    const hook = new Webhook(url);

    hook.setUsername('Invoicerr').setAvatarUrl('https://invoicerr.app/favicon.png');

    const eventType = payload.event as WebhookEvent;
    const eventStyle = EVENT_STYLES[eventType] || {
      color: '#5865F2',
      emoji: '📢',
      title: 'Event',
    };

    const description = formatPayloadForEvent(eventType, payload);

    const embed = new Embed()
      .setTitle(`${eventStyle.emoji} ${eventStyle.title}`)
      .setDescription(description)
      .setTimestamp()
      .setColor(eventStyle.color)
      .setAuthor({
        name: 'Invoicerr',
        url: 'https://invoicerr.app',
        icon_url: 'https://invoicerr.app/favicon.png',
      })
      .setFooter({
        text: 'Invoicerr Webhooks',
        icon_url: 'https://invoicerr.app/favicon.png',
      });

    if (payload.company?.name) {
      embed.addField('Entreprise', payload.company.name, true);
    }

    // NOTE: `@teever/ez-hook`'s RequestClient issues its own internal `fetch()` and does not expose a
    // `redirect` override (only `signal`/`headers`/`timeoutMs` — see node_modules/@teever/ez-hook's
    // RequestClient.send), so unlike the other drivers this one still follows redirects. The pre-send
    // SSRF re-validation (webhooks.service.ts#send) still blocks a direct internal target; only a
    // 30x-to-internal from an already-validated public endpoint is not covered here. Tracked as a
    // residual gap rather than vendoring/patching a third-party dependency for it.
    const res = await hook.addEmbed(embed).send({ timeoutMs: WEBHOOK_FETCH_TIMEOUT_MS });
    return res.ok;
  }
}
