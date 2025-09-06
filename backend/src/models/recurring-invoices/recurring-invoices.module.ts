import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { RecurringInvoicesController } from '@/models/recurring-invoices/recurring-invoices.controller';
import { MailService } from '@/mail/mail.service';
import { InvoicesService } from '@/models/invoices/invoices.service';
import { RecurringInvoicesCronService } from '@/models/recurring-invoices/cron.service';
import { RecurringInvoicesService } from '@/models/recurring-invoices/recurring-invoices.service';

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
