import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './models/auth/auth.module';
import { ClientsModule } from './models/clients/clients.module';
import { CompanyModule } from './models/company/company.module';
import { DashboardModule } from './models/dashboard/dashboard.module';
import { InvoicesModule } from './models/invoices/invoices.module';
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { QuotesModule } from './models/quotes/quotes.module';

@Module({
  imports: [AuthModule, CompanyModule, ClientsModule, QuotesModule, InvoicesModule, DashboardModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
