import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService, JwtService]
})
export class DashboardModule { }
