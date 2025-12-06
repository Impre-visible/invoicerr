import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PaymentMethod, PaymentMethodType, WebhookEvent } from '../../../prisma/generated/prisma/client';

import { WebhookDispatcherService } from '../webhooks/webhook-dispatcher.service';
import prisma from '@/prisma/prisma.service';

export interface CreatePaymentMethodDto {
  name: string;
  details?: string;
  type?: PaymentMethodType;
}

export interface EditPaymentMethodDto {
  name?: string;
  details?: string | null;
  type?: PaymentMethodType;
  isActive?: boolean;
}

@Injectable()
export class PaymentMethodsService {
  private readonly logger: Logger;

  constructor(private readonly webhookDispatcher: WebhookDispatcherService) {
    this.logger = new Logger(PaymentMethodsService.name);
  }
  async create(dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    const company = await prisma.company.findFirst();
    if (!company) {
      throw new BadRequestException('No company found. Please create a company first.');
    }

    const pm = await prisma.paymentMethod.create({
      data: {
        companyId: company.id,
        name: dto.name,
        details: dto.details ?? '',
        type: dto.type ?? PaymentMethodType.BANK_TRANSFER,
      },
    });

    try {
      await this.webhookDispatcher.dispatch(WebhookEvent.PAYMENT_METHOD_CREATED, {
        paymentMethod: pm,
        company,
      });
    } catch (error) {
      this.logger.error('Failed to dispatch PAYMENT_METHOD_CREATED webhook', error);
    }

    return pm;
  }

  async findAll(): Promise<PaymentMethod[]> {
    const company = await prisma.company.findFirst();
    if (!company) {
      throw new BadRequestException('No company found. Please create a company first.');
    }

    return prisma.paymentMethod.findMany({
      where: { companyId: company.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<PaymentMethod | null> {
    const pm = await prisma.paymentMethod.findUnique({ where: { id } });
    if (!pm) return null;
    const company = await prisma.company.findFirst();
    if (!company || pm.companyId !== company.id) {
      return null;
    }
    return pm;
  }

  async update(id: string, dto: EditPaymentMethodDto): Promise<PaymentMethod> {
    const existing = await prisma.paymentMethod.findUnique({ where: { id } });
    if (!existing) {
      throw new BadRequestException('Payment method not found');
    }

    const company = await prisma.company.findFirst();
    if (!company || existing.companyId !== company.id) {
      throw new BadRequestException('Payment method not found');
    }

    const updatedPm = await prisma.paymentMethod.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        details: dto.details ?? existing.details,
        type: dto.type ?? existing.type,
        isActive: dto.isActive ?? existing.isActive,
      },
    });

    try {
      await this.webhookDispatcher.dispatch(WebhookEvent.PAYMENT_METHOD_UPDATED, {
        paymentMethod: updatedPm,
        company,
      });

      if (dto.isActive !== undefined && dto.isActive !== existing.isActive) {
        const event = dto.isActive ? WebhookEvent.PAYMENT_METHOD_ACTIVATED : WebhookEvent.PAYMENT_METHOD_DEACTIVATED;
        await this.webhookDispatcher.dispatch(event, {
          paymentMethod: updatedPm,
          company,
        });
      }
    } catch (error) {
      this.logger.error('Failed to dispatch PAYMENT_METHOD webhook', error);
    }

    return updatedPm;
  }

  async softDelete(id: string): Promise<PaymentMethod> {
    const existing = await prisma.paymentMethod.findUnique({ where: { id } });
    if (!existing) {
      throw new BadRequestException('Payment method not found');
    }

    const company = await prisma.company.findFirst();
    if (!company || existing.companyId !== company.id) {
      throw new BadRequestException('Payment method not found');
    }

    const deletedPm = await prisma.paymentMethod.update({
      where: { id },
      data: { isActive: false },
    });

    try {
      await this.webhookDispatcher.dispatch(WebhookEvent.PAYMENT_METHOD_DELETED, {
        paymentMethod: existing,
        company,
      });
    } catch (error) {
      this.logger.error('Failed to dispatch PAYMENT_METHOD_DELETED webhook', error);
    }

    return deletedPm;
  }
}