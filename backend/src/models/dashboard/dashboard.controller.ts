import { Body, Controller, Get } from '@nestjs/common';

import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboardInfo(): Promise<any> {
    return await this.dashboardService.getDashboardData();
  }
}
