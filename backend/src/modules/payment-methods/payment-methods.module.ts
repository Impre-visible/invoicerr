import { Module } from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { PaymentMethodsController } from './payment-methods.controller';

@Module({
  providers: [PaymentMethodsService],
  controllers: [PaymentMethodsController],
  exports: [PaymentMethodsService],
})
export class PaymentMethodsModule {}