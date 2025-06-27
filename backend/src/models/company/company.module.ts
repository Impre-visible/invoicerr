import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [CompanyController],
  providers: [CompanyService, PrismaService, JwtService]
})
export class CompanyModule { }
