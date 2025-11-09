import { Module } from '@nestjs/common';
import { PluginsModule } from '../plugins/plugins.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
    imports: [PluginsModule],
    controllers: [WebhooksController],
    providers: [WebhooksService],
    exports: [WebhooksService],
})
export class WebhooksModule { }
