import { UpsertInvoicesDto } from '@/models/recurring-invoices/dto/invoices.dto';
import { RecurringInvoicesService } from '@/models/recurring-invoices/recurring-invoices.service';
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

@Controller('recurring-invoices')
export class RecurringInvoicesController {
  constructor(
    private readonly recurringInvoicesService: RecurringInvoicesService,
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
