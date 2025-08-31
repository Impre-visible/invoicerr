import { InvoicesService } from '../invoices/invoices.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { Module } from '@nestjs/common';
import { RecurringInvoicesController } from './recurring-invoices.controller';
import { RecurringInvoicesCronService } from './cron.service';
import { RecurringInvoicesService } from './recurring-invoices.service';

@Module({
  controllers: [RecurringInvoicesController],
  providers: [RecurringInvoicesService, RecurringInvoicesCronService, InvoicesService, MailService, JwtService],
  exports: [RecurringInvoicesService, RecurringInvoicesCronService],
})
export class RecurringInvoicesModule { }
