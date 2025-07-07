import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';

import { RecurringInvoicesService } from './recurring-invoices.service';
import { LoginRequired } from 'src/decorators/login-required.decorator';

@Controller('recurring-invoices')
export class RecurringInvoicesController {
    constructor(private readonly recurringInvoicesService: RecurringInvoicesService) { }

    @Get()
    @LoginRequired()
    async getRecurringInvoices(@Query('page') page: string = "1") {
        return this.recurringInvoicesService.getRecurringInvoices(page);
    }

    @Post()
    @LoginRequired()
    async createRecurringInvoice(@Body() body: any) {
        return this.recurringInvoicesService.createRecurringInvoice(body);
    }
}
