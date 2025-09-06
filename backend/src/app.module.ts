import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { CompanyModule } from './modules/company/company.module';
import { DangerModule } from './modules/danger/danger.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { MailService } from './mail/mail.service';
import { APP_GUARD } from '@nestjs/core';
import { PluginsModule } from './modules/plugins/plugins.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { ReceiptsModule } from './modules/receipts/receipts.module';
import { RecurringInvoicesModule } from './modules/recurring-invoices/recurring-invoices.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SignaturesModule } from './modules/signatures/signatures.module';
import { LoginRequiredGuard } from 'src/guards/login-required.guard';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '@/modules/auth/auth.service';

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
