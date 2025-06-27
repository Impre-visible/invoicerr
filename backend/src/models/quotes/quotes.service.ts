import { CreateQuoteDto, EditQuotesDto } from './dto/quotes.dto';

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class QuotesService {
    constructor(private readonly prisma: PrismaService) { }

    private async getNextQuoteNumber() {
        const currentYear = new Date().getFullYear();

        const lastQuote = await this.prisma.quote.findFirst({
            where: {
                createdAt: {
                    gte: new Date(`${currentYear}-01-01T00:00:00Z`),
                    lt: new Date(`${currentYear + 1}-01-01T00:00:00Z`),
                },
            },
            orderBy: {
                number: 'desc',
            },
        });

        let nextIndex = 1;
        if (lastQuote) {
            const parts = lastQuote.number.split('-');
            nextIndex = parseInt(parts[2]) + 1;
        }
        const paddedIndex = String(nextIndex).padStart(4, '0');
        return `Q-${currentYear}-${paddedIndex}`;
    }

    async createQuote(body: CreateQuoteDto) {
        const { items, ...data } = body;

        return this.prisma.quote.create({
            data: {
                ...data,
                number: await this.getNextQuoteNumber(),
                companyId: (await this.prisma.company.findFirst())?.id || '',
                totalHT: items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
                totalVAT: items.reduce((sum, item) => sum +
                    (item.quantity * item.unitPrice * (item.vatRate || 0) / 100), 0),
                totalTTC: items.reduce((sum, item) => sum +
                    (item.quantity * item.unitPrice * (1 + (item.vatRate || 0) / 100)), 0),
                items: {
                    create: items.map(item => ({
                        ...item,
                        vatRate: item.vatRate || 0,
                        order: item.order || 0,
                    })),
                },
                validUntil: body.validUntil ? new Date(body.validUntil) : null,
            }
        });
    }
}
