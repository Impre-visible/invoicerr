import * as Handlebars from 'handlebars';

import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateQuoteDto, EditQuotesDto } from './dto/quotes.dto';
import { getInvertColor, getPDF } from 'src/utils/pdf';

import { baseTemplate } from './templates/base.template';
import { formatDate } from 'src/utils/date';
import prisma from 'src/prisma/prisma.service';

@Injectable()
export class QuotesService {

    async getQuotes(page: string) {
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = 10;
        const skip = (pageNumber - 1) * pageSize;

        const quotes = await prisma.quote.findMany({
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
                client: true,
                company: true
            },
        });

        const totalQuotes = await prisma.quote.count();

        return { pageCount: Math.ceil(totalQuotes / pageSize), quotes };
    }

    async searchQuotes(query: string) {
        if (!query) {
            return prisma.quote.findMany({
                take: 10,
                orderBy: {
                    number: 'asc',
                },
                include: {
                    items: true,
                    company: true,
                    client: true,
                },
            });
        }

        return prisma.quote.findMany({
            where: {
                isActive: true,
                OR: [
                    { title: { contains: query } },
                    { client: { name: { contains: query } } },
                ],
            },
            take: 10,
            orderBy: {
                number: 'asc',
            },
            include: {
                items: true,
                company: true,
                client: true,
            },
        });
    }

    async createQuote(body: CreateQuoteDto) {
        const { items, ...data } = body;

        const company = await prisma.company.findFirst();

        if (!company) {
            throw new BadRequestException('No company found. Please create a company first.');
        }

        const client = await prisma.client.findUnique({
            where: { id: body.clientId },
        });

        if (!client) {
            throw new BadRequestException('Client not found');
        }

        return prisma.quote.create({
            data: {
                ...data,
                notes: body.notes,
                companyId: company.id,
                currency: body.currency || client.currency || company.currency,
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
            throw new BadRequestException('Quote ID is required for editing');
        }

        const existingQuote = await prisma.quote.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!existingQuote) {
            throw new BadRequestException('Quote not found');
        }

        const existingItemIds = existingQuote.items.map(i => i.id);
        const incomingItemIds = items.filter(i => i.id).map(i => i.id!);

        const itemIdsToDelete = existingItemIds.filter(id => !incomingItemIds.includes(id));

        const totalHT = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const totalVAT = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.vatRate || 0) / 100), 0);
        const totalTTC = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (1 + (item.vatRate || 0) / 100)), 0);

        const updateQuote = await prisma.quote.update({
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

        await prisma.signature.updateMany({
            where: { quoteId: id },
            data: { isActive: false },
        });

        return updateQuote;
    }

    async deleteQuote(id: string) {
        const existingQuote = await prisma.quote.findUnique({ where: { id } });

        if (!existingQuote) {
            throw new BadRequestException('Quote not found');
        }

        return prisma.quote.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async getQuotePdf(id: string): Promise<Uint8Array> {
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: {
                items: true,
                client: true,
                company: {
                    include: { pdfConfig: true },
                },
            },
        });

        if (!quote || !quote.company || !quote.company.pdfConfig) {
            throw new BadRequestException('Quote or associated PDF config not found');
        }

        const config = quote.company.pdfConfig;
        const templateHtml = baseTemplate;
        const template = Handlebars.compile(templateHtml);

        const html = template({
            number: quote.rawNumber || quote.number.toString(),
            date: formatDate(quote.company, quote.createdAt),
            validUntil: formatDate(quote.company, quote.validUntil),
            company: quote.company,
            client: quote.client,
            currency: quote.currency,
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

            paymentMethod: quote.paymentMethod,
            paymentDetails: quote.paymentDetails,

            // 🎨 Style & labels from PDFConfig
            fontFamily: config.fontFamily,
            padding: config.padding,
            primaryColor: config.primaryColor,
            secondaryColor: config.secondaryColor,
            tableTextColor: getInvertColor(config.secondaryColor),
            includeLogo: config.includeLogo,
            logoB64: config?.logoB64 ?? '',
            noteExists: !!quote.notes,
            notes: (quote.notes || '').replace(/\n/g, '<br>'),
            labels: {
                quote: config.quote,
                quoteFor: config.quoteFor,
                description: config.description,
                quantity: config.quantity,
                unitPrice: config.unitPrice,
                vatRate: config.vatRate,
                subtotal: config.subtotal,
                total: config.total,
                vat: config.vat,
                grandTotal: config.grandTotal,
                validUntil: config.validUntil,
                date: config.date,
                notes: config.notes,
                paymentMethod: config.paymentMethod,
                paymentDetails: config.paymentDetails,
                legalId: config.legalId,
                VATId: config.VATId,
            },
        });

        const pdfBuffer = await getPDF(html);

        return pdfBuffer;
    }

    async markQuoteAsSigned(id: string) {
        if (!id) {
            throw new BadRequestException('Quote ID is required');
        }

        const existingQuote = await prisma.quote.findUnique({ where: { id } });

        if (!existingQuote) {
            throw new BadRequestException('Quote not found');
        }

        return prisma.quote.update({
            where: { id },
            data: { signedAt: new Date(), status: "SIGNED" },
        });
    }

}
