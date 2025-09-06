import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { RecurringInvoicesService } from './recurring-invoices.service';
import { RecurringInvoicesCronService } from './cron.service';
import { UpsertInvoicesDto } from './dto/invoices.dto';

@Controller('recurring-invoices')
export class RecurringInvoicesController {
  constructor(
    private readonly recurringInvoicesService: RecurringInvoicesService,
    private readonly cronService: RecurringInvoicesCronService,
  ) {}

  @Get()
  async getRecurringInvoices(@Query('page') page: string = '1') {
    return this.recurringInvoicesService.getRecurringInvoices(page);
  }

  @Get(':id')
  async getRecurringInvoice(@Param('id') id: string) {
    return this.recurringInvoicesService.getRecurringInvoice(id);
  }

  @Post()
  async createRecurringInvoice(@Body() body: UpsertInvoicesDto) {
    return this.recurringInvoicesService.createRecurringInvoice(body);
  }

  @Patch(':id')
  async updateRecurringInvoice(
    @Param('id') id: string,
    @Body() body: UpsertInvoicesDto,
  ) {
    return this.recurringInvoicesService.updateRecurringInvoice(id, body);
  }

  @Delete(':id')
  async deleteRecurringInvoice(@Param('id') id: string) {
    return this.recurringInvoicesService.deleteRecurringInvoice(id);
  }
}
