import { BadRequestException, Injectable } from '@nestjs/common';
import prisma from '@/prisma/prisma.service';
import { PaymentMethod, PaymentMethodType } from '@invoicerr/prisma';

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

    return prisma.paymentMethod.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        details: dto.details ?? existing.details,
        type: dto.type ?? existing.type,
        isActive: dto.isActive ?? existing.isActive,
      },
    });
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

    return prisma.paymentMethod.update({
      where: { id },
      data: { isActive: false },
    });
  }
}