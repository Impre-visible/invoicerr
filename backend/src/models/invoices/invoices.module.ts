import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { Module } from '@nestjs/common';
import { PluginsService } from '../plugins/plugins.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService, PrismaService, MailService, JwtService, PluginsService]
})
export class InvoicesModule { }
