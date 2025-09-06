import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { CompanyController } from '@/modules/company/company.controller';
import { CompanyService } from '@/modules/company/company.service';

@Module({
  controllers: [CompanyController],
  providers: [CompanyService, JwtService]
})
export class CompanyModule { }
