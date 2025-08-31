import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, JwtService]
})
export class DashboardModule { }
