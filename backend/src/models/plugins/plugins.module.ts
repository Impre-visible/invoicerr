import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { Module } from '@nestjs/common';
import { PluginsController } from './plugins.controller';
import { PluginsService } from './plugins.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [PluginsController],
  providers: [PluginsService, PrismaService, MailService, JwtService]
})
export class PluginsModule { }
