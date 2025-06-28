import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

import { CreateQuoteDto, EditQuotesDto } from './dto/quotes.dto';

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { lightTemplate } from './templates/light.template';

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

    async getQuotes(page: string) {
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = 10;
        const skip = (pageNumber - 1) * pageSize;

        const quotes = await this.prisma.quote.findMany({
            skip,
            take: pageSize,
            where: {
                isActive: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                items: true,
                client: true
            },
        });

        const totalQuotes = await this.prisma.quote.count();

        return { pageCount: Math.ceil(totalQuotes / pageSize), quotes };
    }

    async searchQuotes(query: string) {
        if (!query) {
            return this.prisma.quote.findMany({
                take: 10,
                orderBy: {
                    number: 'asc',
                },
            });
        }

        return this.prisma.quote.findMany({
            where: {
                isActive: true,
                OR: [
                    { number: { contains: query } },
                    { title: { contains: query } },
                    { client: { name: { contains: query } } },
                ],
            },
            take: 10,
            orderBy: {
                number: 'asc',
            },
            include: {
                client: true,
            },
        });
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

    async editQuote(body: EditQuotesDto) {
        const { items, id, ...data } = body;

        if (!id) {
            throw new Error('Quote ID is required for editing');
        }

        const existingQuote = await this.prisma.quote.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!existingQuote) {
            throw new Error('Quote not found');
        }

        const existingItemIds = existingQuote.items.map(i => i.id);
        const incomingItemIds = items.filter(i => i.id).map(i => i.id!);

        const itemIdsToDelete = existingItemIds.filter(id => !incomingItemIds.includes(id));

        const totalHT = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const totalVAT = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.vatRate || 0) / 100), 0);
        const totalTTC = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (1 + (item.vatRate || 0) / 100)), 0);

        const updateQuote = await this.prisma.quote.update({
            where: { id },
            data: {
                ...data,
                validUntil: body.validUntil ? new Date(body.validUntil) : null,
                totalHT,
                totalVAT,
                totalTTC,
                items: {
                    deleteMany: {
                        id: { in: itemIdsToDelete },
                    },
                    updateMany: items
                        .filter(i => i.id)
                        .map(i => ({
                            where: { id: i.id! },
                            data: {
                                description: i.description,
                                quantity: i.quantity,
                                unitPrice: i.unitPrice,
                                vatRate: i.vatRate || 0,
                                order: i.order || 0,
                            },
                        })),
                    create: items
                        .filter(i => !i.id)
                        .map(i => ({
                            description: i.description,
                            quantity: i.quantity,
                            unitPrice: i.unitPrice,
                            vatRate: i.vatRate || 0,
                            order: i.order || 0,
                        })),
                },
            },
        });

        return updateQuote;
    }

    async deleteQuote(id: string) {
        const existingQuote = await this.prisma.quote.findUnique({ where: { id } });

        if (!existingQuote) {
            throw new Error('Quote not found');
        }

        return this.prisma.quote.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async getQuotePdf(id: string): Promise<Uint8Array> {
        const quote = await this.prisma.quote.findUnique({
            where: { id },
            include: {
                items: true,
                client: true,
                company: true,
            },
        });

        if (!quote) {
            throw new Error('Quote not found');
        }

        const templateHtml = lightTemplate;
        const template = Handlebars.compile(templateHtml);

        const html = template({
            number: quote.number,
            date: new Date(quote.createdAt).toLocaleDateString(),
            validUntil: quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'N/A',
            company: quote.company,
            client: quote.client,
            currency: quote.company.currency,
            items: quote.items.map(i => ({
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice.toFixed(2),
                vatRate: i.vatRate,
                totalPrice: (i.quantity * i.unitPrice * (1 + (i.vatRate || 0) / 100)).toFixed(2),
            })),
            totalHT: quote.totalHT.toFixed(2),
            totalVAT: quote.totalVAT.toFixed(2),
            totalTTC: quote.totalTTC.toFixed(2),
        });

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

        await browser.close();

        return pdfBuffer;
    }

    async markQuoteAsSigned(id: string) {
        if (!id) {
            throw new Error('Quote ID is required');
        }

        const existingQuote = await this.prisma.quote.findUnique({ where: { id } });

        if (!existingQuote) {
            throw new Error('Quote not found');
        }

        return this.prisma.quote.update({
            where: { id },
            data: { signedAt: new Date(), status: "SIGNED" },
        });
    }

}
