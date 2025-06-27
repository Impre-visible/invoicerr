import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './models/auth/auth.module';
import { CompanyModule } from './models/company/company.module';
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [AuthModule, CompanyModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
