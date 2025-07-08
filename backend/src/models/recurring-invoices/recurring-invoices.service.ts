import { Currency } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpsertInvoicesDto } from './dto/invoices.dto';

@Injectable()
export class RecurringInvoicesService {
    constructor(private readonly prisma: PrismaService) { }

    async getRecurringInvoices(page: string = "1") {
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = 10;
        const skip = (pageNumber - 1) * pageSize;

        const recurringInvoices = await this.prisma.recurringInvoice.findMany({
            skip,
            take: pageSize,
            include: {
                client: true,
                company: true,
                items: true,
            },
        });

        const totalCount = await this.prisma.recurringInvoice.count();

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

        // Calculate next invoice date based on frequency
        const nextInvoiceDate = this.calculateNextInvoiceDate(new Date(), data.frequency);

        const recurringInvoice = await this.prisma.recurringInvoice.create({
            data: {
                clientId: data.clientId,
                companyId: "company-id", // TODO: Get from context
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
        const recurringInvoice = await this.prisma.recurringInvoice.update({
            where: { id },
            data: {
                notes: data.notes,
                paymentMethod: data.paymentMethod,
                paymentDetails: data.paymentDetails,
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
