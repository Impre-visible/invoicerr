import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import {
  PaymentMethodsService,
  CreatePaymentMethodDto,
  EditPaymentMethodDto,
} from './payment-methods.service';

@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly service: PaymentMethodsService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const pm = await this.service.findOne(id);
    if (!pm) {
      return { message: 'Not found' };
    }
    return pm;
  }

  @Post()
  async create(@Body() dto: CreatePaymentMethodDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: EditPaymentMethodDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}