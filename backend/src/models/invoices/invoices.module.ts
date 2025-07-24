import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService, PrismaService, MailService, JwtService]
})
export class InvoicesModule { }
