import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { MailService } from '@/mail/mail.service';
import { PluginsController } from '@/modules/plugins/plugins.controller';
import { PluginsService } from '@/modules/plugins/plugins.service';

@Module({
  controllers: [PluginsController],
  providers: [PluginsService, MailService, JwtService]
})
export class PluginsModule { }
