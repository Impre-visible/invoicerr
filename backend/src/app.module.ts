import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Module } from '@nestjs/common';
import { AuthModule } from './models/auth/auth.module';
import { ClientsModule } from './models/clients/clients.module';
import { CompanyModule } from './models/company/company.module';
import { DangerModule } from './models/danger/danger.module';
import { DashboardModule } from './models/dashboard/dashboard.module';
import { InvoicesModule } from './models/invoices/invoices.module';
import { MailService } from './mail/mail.service';
import { APP_GUARD } from '@nestjs/core';
import { PluginsModule } from './models/plugins/plugins.module';
import { QuotesModule } from './models/quotes/quotes.module';
import { ReceiptsModule } from './models/receipts/receipts.module';
import { RecurringInvoicesModule } from './models/recurring-invoices/recurring-invoices.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SignaturesModule } from './models/signatures/signatures.module';
import { LoginRequiredGuard } from 'src/guards/login-required.guard';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
    PluginsModule,
    RecurringInvoicesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MailService,
    {
      provide: APP_GUARD,
      useClass: LoginRequiredGuard,
    },
  ],
})
export class AppModule {}
