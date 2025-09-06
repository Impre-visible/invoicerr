import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { RecurringInvoicesController } from '@/modules/recurring-invoices/recurring-invoices.controller';
import { MailService } from '@/mail/mail.service';
import { InvoicesService } from '@/modules/invoices/invoices.service';
import { RecurringInvoicesCronService } from '@/modules/recurring-invoices/cron.service';
import { RecurringInvoicesService } from '@/modules/recurring-invoices/recurring-invoices.service';

@Module({
  controllers: [RecurringInvoicesController],
  providers: [
    RecurringInvoicesService,
    RecurringInvoicesCronService,
    InvoicesService,
    MailService,
    JwtService,
  ],
  exports: [RecurringInvoicesService, RecurringInvoicesCronService],
})
export class RecurringInvoicesModule {}
