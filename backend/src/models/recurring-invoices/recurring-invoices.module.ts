import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecurringInvoicesController } from './recurring-invoices.controller';
import { RecurringInvoicesService } from './recurring-invoices.service';

@Module({
  controllers: [RecurringInvoicesController],
  providers: [RecurringInvoicesService, PrismaService, JwtService]
})
export class RecurringInvoicesModule { }
