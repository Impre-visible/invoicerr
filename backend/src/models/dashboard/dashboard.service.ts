import { Invoice, Quote } from '@prisma/client';

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

interface DashboardData {
    quotes: {
        total: number;
        draft: number;
        sent: number;
        signed: number;
        expired: number;
        latests: Quote[];
    };
    invoices: {
        total: number;
        unpaid: number;
        sent: number;
        paid: number;
        overdue: number;
        latests: Invoice[];
    };
    clients: {
        total: number;
    };
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
        };
    }
}
