import { UpsertInvoicesDto } from '@/models/recurring-invoices/dto/invoices.dto';
import prisma from '@/prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Currency } from '@prisma/client';

@Injectable()
export class RecurringInvoicesService {
    constructor() { }

    async getRecurringInvoices(page: string = "1") {
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = 10;
        const skip = (pageNumber - 1) * pageSize;

        const recurringInvoices = await prisma.recurringInvoice.findMany({
            skip,
            take: pageSize,
            include: {
                client: true,
                company: true,
                items: true,
            },
        });

        const totalCount = await prisma.recurringInvoice.count();

        return {
            data: recurringInvoices,
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / pageSize),
        };
    }

    async createRecurringInvoice(data: UpsertInvoicesDto) {
        // Calculate totals
        let totalHT = 0;
        let totalVAT = 0;
        let totalTTC = 0;

        for (const item of data.items) {
            const itemHT = item.quantity * item.unitPrice;
            const itemVAT = itemHT * (item.vatRate / 100);
            totalHT += itemHT;
            totalVAT += itemVAT;
        }
        totalTTC = totalHT + totalVAT;

        const today = new Date();
        const nextMonday = new Date(today);
        const dayOfWeek = today.getDay();
        const daysUntilNextMonday = (dayOfWeek === 0 ? 1 : 8) - dayOfWeek;
        nextMonday.setDate(today.getDate() + daysUntilNextMonday);

        const nextInvoiceDate = this.calculateNextInvoiceDate(nextMonday, data.frequency);

        const recurringInvoice = await prisma.recurringInvoice.create({
            data: {
                clientId: data.clientId,
                companyId: (await prisma.company.findFirst())?.id || "1",
                notes: data.notes,
                paymentMethod: data.paymentMethod,
                paymentDetails: data.paymentDetails,
                frequency: data.frequency,
                count: data.count,
                until: data.until,
                autoSend: data.autoSend || false,
                nextInvoiceDate,
                currency: (data.currency as Currency) || Currency.USD,
                totalHT,
                totalVAT,
                totalTTC,
                items: {
                    create: data.items.map((item, index) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        vatRate: item.vatRate,
                        order: item.order || index,
                    })),
                },
            },
            include: {
                client: true,
                company: true,
                items: true,
            },
        });

        return recurringInvoice;
    }

    async updateRecurringInvoice(id: string, data: UpsertInvoicesDto) {
        // Calculate totals
        let totalHT = 0;
        let totalVAT = 0;
        let totalTTC = 0;

        for (const item of data.items) {
            const itemHT = item.quantity * item.unitPrice;
            const itemVAT = itemHT * (item.vatRate / 100);
            totalHT += itemHT;
            totalVAT += itemVAT;
        }
        totalTTC = totalHT + totalVAT;

        // Update recurring invoice
        const recurringInvoice = await prisma.recurringInvoice.update({
            where: { id },
            data: {
                notes: data.notes,
                paymentMethod: data.paymentMethod,
                paymentDetails: data.paymentDetails,
                nextInvoiceDate: this.calculateNextInvoiceDate(new Date(), data.frequency),
                frequency: data.frequency,
                count: data.count,
                until: data.until,
                autoSend: data.autoSend || false,
                currency: (data.currency as Currency) || Currency.USD,
                totalHT,
                totalVAT,
                totalTTC,
                items: {
                    deleteMany: {},
                    create: data.items.map((item, index) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        vatRate: item.vatRate,
                        order: item.order || index,
                    })),
                },
            },
            include: {
                client: true,
                company: true,
                items: true,
            },
        });

        return recurringInvoice;
    }

    async getRecurringInvoice(id: string) {
        const recurringInvoice = await prisma.recurringInvoice.findUnique({
            where: { id },
            include: {
                client: true,
                company: true,
                items: true,
            },
        });

        if (!recurringInvoice) {
            throw new BadRequestException('Recurring invoice not found');
        }

        return recurringInvoice;
    }

    async deleteRecurringInvoice(id: string) {
        const existingRecurringInvoice = await prisma.recurringInvoice.findUnique({
            where: { id }
        });

        if (!existingRecurringInvoice) {
            throw new BadRequestException('Recurring invoice not found');
        }

        // Supprimer en cascade les items puis la facture récurrente
        await prisma.recurringInvoiceItem.deleteMany({
            where: { recurringInvoiceId: id }
        });

        return prisma.recurringInvoice.delete({
            where: { id }
        });
    }

    private calculateNextInvoiceDate(from: Date, frequency: string): Date {
        const nextDate = new Date(from);

        switch (frequency) {
            case 'WEEKLY':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'BIWEEKLY':
                nextDate.setDate(nextDate.getDate() + 14);
                break;
            case 'MONTHLY':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'BIMONTHLY':
                nextDate.setMonth(nextDate.getMonth() + 2);
                break;
            case 'QUARTERLY':
                nextDate.setMonth(nextDate.getMonth() + 3);
                break;
            case 'QUADMONTHLY':
                nextDate.setMonth(nextDate.getMonth() + 4);
                break;
            case 'SEMIANNUALLY':
                nextDate.setMonth(nextDate.getMonth() + 6);
                break;
            case 'ANNUALLY':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
            default:
                nextDate.setMonth(nextDate.getMonth() + 1); // Default to monthly
        }

        return nextDate;
    }
}
