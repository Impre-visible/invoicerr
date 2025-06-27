import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './models/auth/auth.module';
import { ClientsModule } from './models/clients/clients.module';
import { CompanyModule } from './models/company/company.module';
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [AuthModule, CompanyModule, ClientsModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
