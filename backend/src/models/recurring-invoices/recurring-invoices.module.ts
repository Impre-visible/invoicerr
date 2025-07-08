import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecurringInvoicesController } from './recurring-invoices.controller';
import { RecurringInvoicesService } from './recurring-invoices.service';
import { RecurringInvoicesCronService } from './cron.service';
import { InvoicesService } from '../invoices/invoices.service';

@Module({
  controllers: [RecurringInvoicesController],
  providers: [RecurringInvoicesService, RecurringInvoicesCronService, InvoicesService, PrismaService, JwtService],
  exports: [RecurringInvoicesService, RecurringInvoicesCronService],
})
export class RecurringInvoicesModule { }
