import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';

import { CreateInvoiceDto, EditInvoicesDto } from './dto/invoices.dto';

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { lightTemplate } from './templates/light.template';

@Injectable()
export class InvoicesService {
    constructor(private readonly prisma: PrismaService) { }

    private async getNextInvoiceNumber() {
        const currentYear = new Date().getFullYear();

        const lastInvoice = await this.prisma.invoice.findFirst({
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
        if (lastInvoice) {
            const parts = lastInvoice.number.split('-');
            nextIndex = parseInt(parts[2]) + 1;
        }
        const paddedIndex = String(nextIndex).padStart(4, '0');
        return `INV-${currentYear}-${paddedIndex}`;
    }

    async getInvoices(page: string) {
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = 10;
        const skip = (pageNumber - 1) * pageSize;

        const invoices = await this.prisma.invoice.findMany({
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

        const totalInvoices = await this.prisma.invoice.count();

        return { pageCount: Math.ceil(totalInvoices / pageSize), invoices };
    }

    async createInvoice(body: CreateInvoiceDto) {
        const { items, ...data } = body;

        return this.prisma.invoice.create({
            data: {
                ...data,
                number: await this.getNextInvoiceNumber(),
                companyId: (await this.prisma.company.findFirst())?.id || '',
                totalHT: items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
                totalVAT: items.reduce((sum, item) => sum +
                    (item.quantity * item.unitPrice * (item.vatRate || 0) / 100), 0),
                totalTTC: items.reduce((sum, item) => sum +
                    (item.quantity * item.unitPrice * (1 + (item.vatRate || 0) / 100)), 0),
                items: {
                    create: items.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        vatRate: item.vatRate || 0,
                        order: item.order || 0,
                    })),
                },
                dueDate: data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            }
        });
    }

    async editInvoice(body: EditInvoicesDto) {
        const { items, id, ...data } = body;

        if (!id) {
            throw new Error('Invoice ID is required for editing');
        }

        const existingInvoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!existingInvoice) {
            throw new Error('Invoice not found');
        }

        const existingItemIds = existingInvoice.items.map(i => i.id);
        const incomingItemIds = items.filter(i => i.id).map(i => i.id!);

        const itemIdsToDelete = existingItemIds.filter(id => !incomingItemIds.includes(id));

        const totalHT = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const totalVAT = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.vatRate || 0) / 100), 0);
        const totalTTC = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (1 + (item.vatRate || 0) / 100)), 0);

        const updateInvoice = await this.prisma.invoice.update({
            where: { id },
            data: {
                ...data,
                dueDate: data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
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

        return updateInvoice;
    }

    async deleteInvoice(id: string) {
        const existingInvoice = await this.prisma.invoice.findUnique({ where: { id } });

        if (!existingInvoice) {
            throw new Error('Invoice not found');
        }

        return this.prisma.invoice.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async getInvoicePdf(id: string): Promise<Uint8Array> {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: {
                items: true,
                client: true,
                company: true,
            },
        });

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        const templateHtml = lightTemplate;
        const template = Handlebars.compile(templateHtml);

        const html = template({
            number: invoice.number,
            date: new Date(invoice.createdAt).toLocaleDateString('en-GB'),
            dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : 'N/A',
            company: {
                ...invoice.company,
                currency: invoice.company.currency || '€',
            },
            client: invoice.client,
            currency: invoice.company.currency || '€',
            items: invoice.items.map(i => ({
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice.toFixed(2),
                vatRate: i.vatRate ? i.vatRate.toFixed(2) : '0.00',
                totalPrice: (i.quantity * i.unitPrice * (1 + (i.vatRate || 0) / 100)).toFixed(2),
            })),
            totalHT: invoice.totalHT.toFixed(2),
            totalVAT: invoice.totalVAT.toFixed(2),
            totalTTC: invoice.totalTTC.toFixed(2),
        });


        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

        await browser.close();

        return pdfBuffer;
    }

    async createInvoiceFromQuote(quoteId: string) {
        const quote = await this.prisma.quote.findUnique({ where: { id: quoteId }, include: { items: true } });

        if (!quote) {
            throw new Error('Quote not found');
        }

        return this.createInvoice({
            clientId: quote.clientId,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            items: quote.items,
        });
    }
}
