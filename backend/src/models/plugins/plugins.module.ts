import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { MailService } from '@/mail/mail.service';
import { PluginsController } from '@/models/plugins/plugins.controller';
import { PluginsService } from '@/models/plugins/plugins.service';

@Module({
  controllers: [PluginsController],
  providers: [PluginsService, MailService, JwtService]
})
export class PluginsModule { }
