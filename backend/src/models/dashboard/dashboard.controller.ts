import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';

import { DashboardService } from './dashboard.service';
import { LoginRequired } from 'src/decorators/login-required.decorator';
import { Response } from 'express';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get()
    @LoginRequired()
    async getDashboardInfo(): Promise<any> {
        return await this.dashboardService.getDashboardData();
    }
}
