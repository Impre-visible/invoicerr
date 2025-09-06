import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { CompanyController } from '@/models/company/company.controller';
import { CompanyService } from '@/models/company/company.service';

@Module({
  controllers: [CompanyController],
  providers: [CompanyService, JwtService]
})
export class CompanyModule { }
