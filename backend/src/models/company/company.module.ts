import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';

@Module({
  controllers: [CompanyController],
  providers: [CompanyService, JwtService]
})
export class CompanyModule { }
