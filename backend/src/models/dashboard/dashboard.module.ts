import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { DashboardService } from '@/models/dashboard/dashboard.service';
import { DashboardController } from '@/models/dashboard/dashboard.controller';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, JwtService]
})
export class DashboardModule { }
