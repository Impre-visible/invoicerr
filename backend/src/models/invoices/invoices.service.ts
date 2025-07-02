import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';

import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateInvoiceDto, EditInvoicesDto } from './dto/invoices.dto';
import { EInvoice, ExportFormat } from '@fin.cx/einvoice';

import { PrismaService } from 'src/prisma/prisma.service';
import { baseTemplate } from './templates/base.template';
import { finance } from '@fin.cx/einvoice/dist_ts/plugins';

@Injectable()
export class InvoicesService {
    constructor(private readonly prisma: PrismaService) { }

    private formatPattern(pattern: string, number: number): string {
        const date = new Date();
        return pattern.replace(/\{(\w+)(?::(\d+))?\}/g, (_, key, padding) => {
            let value: number | string;

            switch (key) {
                case "year":
                    value = date.getFullYear();
                    break;
                case "month":
                    value = date.getMonth() + 1;
                    break;
                case "day":
                    value = date.getDate();
                    break;
                case "number":
                    value = number;
                    break;
                default:
                    return key; // If the key is not recognized, return it as is
            }

            const padLength = padding !== undefined
                ? parseInt(padding, 10)
                : key === "number"
                    ? 4
                    : 0;

            return value.toString().padStart(padLength, "0");
        });
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
                client: true,
                company: true
            },
        });

        const returnedInvoices = invoices.map(quote => ({
            ...quote,
            number: this.formatPattern(quote.company.invoiceNumberFormat, quote.number)
        }));

        const totalInvoices = await this.prisma.invoice.count();

        return { pageCount: Math.ceil(totalInvoices / pageSize), invoices: returnedInvoices };
    }

    async createInvoice(body: CreateInvoiceDto) {
        const { items, ...data } = body;

        const company = await this.prisma.company.findFirst();
        if (!company) {
            throw new BadRequestException('No company found. Please create a company first.');
        }

        const client = await this.prisma.client.findUnique({
            where: { id: body.clientId },
        });
        if (!client) {
            throw new BadRequestException('Client not found');
        }

        return this.prisma.invoice.create({
            data: {
                ...data,
                currency: body.currency || client.currency || company.currency,
                companyId: company.id, // reuse the already fetched company object
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
            throw new BadRequestException('Invoice ID is required for editing');
        }

        const company = await this.prisma.company.findFirst();
        if (!company) {
            throw new BadRequestException('No company found. Please create a company first.');
        }

        const client = await this.prisma.client.findUnique({
            where: { id: data.clientId },
        });
        if (!client) {
            throw new BadRequestException('Client not found');
        }

        const existingInvoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!existingInvoice) {
            throw new BadRequestException('Invoice not found');
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
                currency: body.currency || client.currency || company.currency,
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
            throw new BadRequestException('Invoice not found');
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
                company: {
                    include: { pdfConfig: true },
                },
            },
        });

        if (!invoice) {
            throw new BadRequestException('Invoice not found');
        }

        const template = Handlebars.compile(baseTemplate);

        const formatDate = (date?: Date) =>
            date ? new Date(date).toLocaleDateString('en-GB') : 'N/A';

        const { pdfConfig } = invoice.company;

        const html = template({
            number: invoice.number,
            date: formatDate(invoice.createdAt),
            dueDate: formatDate(invoice.dueDate),
            company: {
                ...invoice.company,
                currency: invoice.company.currency,
                foundedAt: formatDate(invoice.company.foundedAt),
            },
            client: {
                ...invoice.client,
                foundedAt: formatDate(invoice.client.foundedAt),
            },
            currency: invoice.currency,
            items: invoice.items.map(i => ({
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice.toFixed(2),
                vatRate: i.vatRate.toFixed(2),
                totalPrice: (i.quantity * i.unitPrice * (1 + (i.vatRate || 0) / 100)).toFixed(2),
            })),
            totalHT: invoice.totalHT.toFixed(2),
            totalVAT: invoice.totalVAT.toFixed(2),
            totalTTC: invoice.totalTTC.toFixed(2),

            // Personnalisation via pdfConfig
            fontFamily: pdfConfig?.fontFamily ?? 'Inter',
            primaryColor: pdfConfig?.primaryColor ?? '#0ea5e9',
            secondaryColor: pdfConfig?.secondaryColor ?? '#f3f4f6',
            padding: pdfConfig?.padding ?? 40,
            includeLogo: !!pdfConfig?.logoB64,
            logoUrl: pdfConfig?.logoB64 ?? '',

            // Labels
            labels: {
                invoice: pdfConfig.invoice,
                dueDate: pdfConfig.dueDate,
                billTo: pdfConfig.billTo,
                description: pdfConfig.description,
                quantity: pdfConfig.quantity,
                unitPrice: pdfConfig.unitPrice,
                vatRate: pdfConfig.vatRate,
                subtotal: pdfConfig.subtotal,
                total: pdfConfig.total,
                vat: pdfConfig.vat,
                grandTotal: pdfConfig.grandTotal,
                date: pdfConfig.date,
            },

            // Notes optionnelles
            noteExists: !!invoice.notes,
            notes: invoice.notes ?? '',
        });

        let browser: puppeteer.Browser;
        if (!process.env.PUPPETEER_EXECUTABLE_PATH) {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            })
        } else {
            browser = await puppeteer.launch({
                headless: true,
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
        }
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

        await browser.close();

        return pdfBuffer;
    }

    async getInvoicePDFFormat(invoiceId: string, format: ExportFormat): Promise<Uint8Array> {
        const invRec = await this.prisma.invoice.findUnique({ where: { id: invoiceId }, include: { items: true, client: true, company: true, quote: true } });
        if (!invRec) throw new BadRequestException('Invoice not found');

        const inv = new EInvoice();

        const pdfBuffer = await this.getInvoicePdf(invoiceId);

        const companyFoundedDate = new Date(invRec.company.foundedAt || new Date())
        const clientFoundedDate = new Date(invRec.client.foundedAt || new Date());

        inv.id = this.formatPattern(invRec.company.invoiceNumberFormat, invRec.number);
        inv.issueDate = new Date(invRec.createdAt.toISOString().split('T')[0]);
        inv.currency = invRec.company.currency as finance.TCurrency || 'EUR';

        inv.from = {
            name: invRec.company.name,
            description: invRec.company.description,
            status: 'active',
            foundedDate: { day: companyFoundedDate.getDay(), month: companyFoundedDate.getMonth() + 1, year: companyFoundedDate.getFullYear() },
            type: 'company',
            address: {
                streetName: invRec.company.address,
                houseNumber: '',
                city: invRec.company.city,
                postalCode: invRec.company.postalCode,
                country: invRec.company.country,
                countryCode: invRec.company.country
            },
            registrationDetails: { vatId: invRec.company.VAT, registrationId: invRec.company.legalId, registrationName: invRec.company.name }
        };

        inv.to = {
            name: invRec.client.name,
            description: invRec.client.description,
            type: 'company',
            foundedDate: { day: clientFoundedDate.getDay(), month: clientFoundedDate.getMonth() + 1, year: clientFoundedDate.getFullYear() },
            status: invRec.client.isActive ? 'active' : 'planned',
            address: {
                streetName: invRec.client.address,
                houseNumber: '',
                city: invRec.client.city,
                postalCode: invRec.client.postalCode,
                country: invRec.client.country || 'FR',
                countryCode: invRec.client.country || 'FR'
            },
            registrationDetails: { vatId: invRec.client.VAT || 'N/A', registrationId: invRec.client.legalId || 'N/A', registrationName: invRec.client.name }
        };

        invRec.items.forEach(item => {
            inv.addItem({
                name: item.description,
                unitQuantity: item.quantity,
                unitNetPrice: item.unitPrice,
                vatPercentage: item.vatRate || 0
            });
        });

        //const xml = await inv.exportXml(format);

        return await inv.embedInPdf(Buffer.from(pdfBuffer))
    }

    async createInvoiceFromQuote(quoteId: string) {
        const quote = await this.prisma.quote.findUnique({ where: { id: quoteId }, include: { items: true } });

        if (!quote) {
            throw new BadRequestException('Quote not found');
        }

        return this.createInvoice({
            clientId: quote.clientId,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            items: quote.items,
            currency: quote.currency,
        });
    }

    async markInvoiceAsPaid(invoiceId: string) {
        const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });

        if (!invoice) {
            throw new BadRequestException('Invoice not found');
        }

        return this.prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: 'PAID', paidAt: new Date() }
        });
    }
}
