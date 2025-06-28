import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService, PrismaService, JwtService]
})
export class InvoicesModule { }
