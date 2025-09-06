import { DashboardService } from "@/modules/dashboard/dashboard.service";
import { Controller, Get } from "@nestjs/common";

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboardInfo(): Promise<any> {
    return await this.dashboardService.getDashboardData();
  }
}
