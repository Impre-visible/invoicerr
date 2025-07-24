import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './models/auth/auth.module';
import { ClientsModule } from './models/clients/clients.module';
import { CompanyModule } from './models/company/company.module';
import { DangerModule } from './models/danger/danger.module';
import { DashboardModule } from './models/dashboard/dashboard.module';
import { InvoicesModule } from './models/invoices/invoices.module';
import { MailService } from './mail/mail.service';
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { QuotesModule } from './models/quotes/quotes.module';
import { ReceiptsModule } from './models/receipts/receipts.module';
import { RecurringInvoicesModule } from './models/recurring-invoices/recurring-invoices.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SignaturesModule } from './models/signatures/signatures.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    CompanyModule,
    ClientsModule,
    QuotesModule,
    InvoicesModule,
    ReceiptsModule,
    DashboardModule,
    SignaturesModule,
    DangerModule,
    RecurringInvoicesModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, MailService],
})
export class AppModule { }
