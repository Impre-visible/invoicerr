import { Company, Invoice, Quote } from '@prisma/client';

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

interface DashboardData {
    company: Company | null,
    quotes: {
        total: number
        draft: number
        sent: number
        signed: number
        expired: number
        latests: Quote[]
    }
    invoices: {
        total: number
        unpaid: number
        sent: number
        paid: number
        overdue: number
        latests: Invoice[]
    }
    clients: {
        total: number
    }
    revenue: {
        currentMonth: number
        previousMonth: number
        monthlyChange: number
        monthlyChangePercent: number
        currentYear: number
        previousYear: number
        yearlyChange: number
        yearlyChangePercent: number
    }
}

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) { }

    async getDashboardData(): Promise<DashboardData> {
        const quotes = await this.prisma.quote.groupBy({
            by: ['status'],
            _count: true,
        });

        const invoices = await this.prisma.invoice.groupBy({
            by: ['status'],
            _count: true,
        });

        const clientsCount = await this.prisma.client.count();

        return {
            company: await this.prisma.company.findFirst(),
            quotes: {
                total: quotes.reduce((acc, q) => acc + q._count, 0),
                draft: quotes.find(q => q.status === 'DRAFT')?._count || 0,
                sent: quotes.find(q => q.status === 'SENT')?._count || 0,
                signed: quotes.find(q => q.status === 'SIGNED')?._count || 0,
                expired: quotes.find(q => q.status === 'EXPIRED')?._count || 0,
                latests: await this.prisma.quote.findMany({
                    orderBy: { updatedAt: 'desc' },
                    include: { company: true, client: true },
                    take: 5,
                }),
            },
            invoices: {
                total: invoices.reduce((acc, i) => acc + i._count, 0),
                unpaid: invoices.find(i => i.status === 'UNPAID')?._count || 0,
                sent: invoices.find(i => i.status === 'SENT')?._count || 0,
                paid: invoices.find(i => i.status === 'PAID')?._count || 0,
                overdue: invoices.find(i => i.status === 'OVERDUE')?._count || 0,
                latests: await this.prisma.invoice.findMany({
                    orderBy: { updatedAt: 'desc' },
                    include: { company: true, client: true },
                    take: 5,
                }),
            },
            clients: {
                total: clientsCount,
            },
            revenue: {
                currentMonth: await this.getMonthlyRevenue(new Date()),
                previousMonth: await this.getMonthlyRevenue(new Date(new Date().setMonth(new Date().getMonth() - 1))),
                monthlyChange: await this.getMonthlyRevenue(new Date()) - await this.getMonthlyRevenue(new Date(new Date().setMonth(new Date().getMonth() - 1))),
                monthlyChangePercent: this.calculateChangePercent(
                    await this.getMonthlyRevenue(new Date()),
                    await this.getMonthlyRevenue(new Date(new Date().setMonth(new Date().getMonth() - 1)))
                    ,
                ),
                currentYear: await this.getYearlyRevenue(new Date()),
                previousYear: await this.getYearlyRevenue(new Date(new Date().setFullYear(new Date().getFullYear() - 1))),
                yearlyChange: await this.getYearlyRevenue(new Date()) - await this.getYearlyRevenue(new Date(new Date().setFullYear(new Date().getFullYear() - 1))),
                yearlyChangePercent: this.calculateChangePercent(
                    await this.getYearlyRevenue(new Date()),
                    await this.getYearlyRevenue(new Date(new Date().setFullYear(new Date().getFullYear() - 1)))
                ),
            },
        };
    }

    async getMonthlyRevenue(date: Date): Promise<number> {
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const invoices = await this.prisma.invoice.findMany({
            where: {
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
                status: 'PAID',
            },
        });

        return invoices.reduce((total, invoice) => total + invoice.totalTTC, 0);
    }

    async getYearlyRevenue(date: Date): Promise<number> {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const endOfYear = new Date(date.getFullYear() + 1, 0, 0);

        const invoices = await this.prisma.invoice.findMany({
            where: {
                createdAt: {
                    gte: startOfYear,
                    lte: endOfYear,
                },
                status: 'PAID',
            },
        });

        return invoices.reduce((total, invoice) => total + invoice.totalTTC, 0);
    }

    calculateChangePercent(current: number, previous: number): number {
        if (previous === 0) return current > 0 ? 100 : -100; // Avoid division by zero
        return ((current - previous) / previous) * 100;
    }
}
