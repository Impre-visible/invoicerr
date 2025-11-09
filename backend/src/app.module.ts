import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { AuthService } from '@/modules/auth/auth.service';
import { ClientsModule } from './modules/clients/clients.module';
import { CompanyModule } from './modules/company/company.module';
import { ConfigModule } from '@nestjs/config';
import { DangerModule } from './modules/danger/danger.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { JwtModule } from '@nestjs/jwt';
import { LoginRequiredGuard } from 'src/guards/login-required.guard';
import { MailService } from './mail/mail.service';
import { Module } from '@nestjs/common';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';
import { PluginsModule } from './modules/plugins/plugins.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { ReceiptsModule } from './modules/receipts/receipts.module';
import { RecurringInvoicesModule } from './modules/recurring-invoices/recurring-invoices.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SignaturesModule } from './modules/signatures/signatures.module';
import { StatsModule } from './modules/stats/stats.module'
import { WebhooksModule } from './modules/webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    JwtModule.register({
      global: true,
      secret: AuthService.getJWTSecret(),
      signOptions: { expiresIn: '1h' },
    }),
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
    PaymentMethodsModule,
    StatsModule,
    WebhooksModule,
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
export class AppModule { }
