import * as Handlebars from 'handlebars';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EInvoice, ExportFormat } from '@fin.cx/einvoice';
import { MailService } from '@/mail/mail.service';
import { CreateInvoiceDto, EditInvoicesDto } from '@/models/invoices/dto/invoices.dto';
import { baseTemplate } from '@/models/quotes/templates/base.template';
import prisma from '@/prisma/prisma.service';
import { parseAddress } from '@/utils/adress';
import { getInvertColor, getPDF } from '@/utils/pdf';
import { finance } from '@fin.cx/einvoice/dist_ts/plugins';
import { formatDate } from '@/utils/date';

@Injectable()
export class InvoicesService {
    constructor(private readonly mailService: MailService) { }


    async getInvoices(page: string) {
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = 10;
        const skip = (pageNumber - 1) * pageSize;

        const invoices = await prisma.invoice.findMany({
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

        const totalInvoices = await prisma.invoice.count();

        return { pageCount: Math.ceil(totalInvoices / pageSize), invoices };
    }

    async searchInvoices(query: string) {
        if (query === '') {
            return this.getInvoices('1'); // Return first page if query is empty
        }

        return prisma.invoice.findMany({
            where: {
                OR: [
                    { client: { name: { contains: query } } },
                    { items: { some: { description: { contains: query } } } },
                ],
            },
            include: {
                items: true,
                client: true,
                company: true
            },
        });
    }

    async createInvoice(body: CreateInvoiceDto) {
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

        return prisma.invoice.create({
            data: {
                ...data,
                recurringInvoiceId: body.recurringInvoiceId,
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

        const company = await prisma.company.findFirst();
        if (!company) {
            throw new BadRequestException('No company found. Please create a company first.');
        }

        const client = await prisma.client.findUnique({
            where: { id: data.clientId },
        });
        if (!client) {
            throw new BadRequestException('Client not found');
        }

        const existingInvoice = await prisma.invoice.findUnique({
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

        const updateInvoice = await prisma.invoice.update({
            where: { id },
            data: {
                recurringInvoiceId: data.recurringInvoiceId,
                paymentMethod: data.paymentMethod || existingInvoice.paymentMethod,
                paymentDetails: data.paymentDetails || existingInvoice.paymentDetails,
                quoteId: data.quoteId || existingInvoice.quoteId,
                clientId: data.clientId || existingInvoice.clientId,
                notes: data.notes,
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
        const existingInvoice = await prisma.invoice.findUnique({ where: { id } });

        if (!existingInvoice) {
            throw new BadRequestException('Invoice not found');
        }

        return prisma.invoice.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async getInvoicePdf(id: string): Promise<Uint8Array> {
        const invoice = await prisma.invoice.findUnique({
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

        const { pdfConfig } = invoice.company;
        const html = template({
            number: invoice.rawNumber || invoice.number.toString(),
            date: formatDate(invoice.company, invoice.createdAt),
            dueDate: formatDate(invoice.company, invoice.dueDate),
            company: invoice.company,
            client: invoice.client,
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

            paymentMethod: invoice.paymentMethod,
            paymentDetails: invoice.paymentDetails,

            fontFamily: pdfConfig.fontFamily ?? 'Inter',
            primaryColor: pdfConfig.primaryColor ?? '#0ea5e9',
            secondaryColor: pdfConfig.secondaryColor ?? '#f3f4f6',
            tableTextColor: getInvertColor(pdfConfig.secondaryColor),
            padding: pdfConfig?.padding ?? 40,
            includeLogo: !!pdfConfig?.logoB64,
            logoB64: pdfConfig?.logoB64 ?? '',

            noteExists: !!invoice.notes,
            notes: (invoice.notes || '').replace(/\n/g, '<br>'),

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
                notes: pdfConfig.notes,
                paymentMethod: pdfConfig.paymentMethod,
                paymentDetails: pdfConfig.paymentDetails,
                legalId: pdfConfig.legalId,
                VATId: pdfConfig.VATId,
            },
        });

        const pdfBuffer = await getPDF(html);

        return pdfBuffer;
    }

    async getInvoiceXMLFormat(id: string): Promise<EInvoice> {
        const invRec = await prisma.invoice.findUnique({
            where: { id },
            include: {
                items: true,
                client: true,
                company: {
                    include: { pdfConfig: true },
                },
            },
        });

        if (!invRec) {
            throw new BadRequestException('Invoice not found');
        }

        const inv = new EInvoice();

        const companyFoundedDate = new Date(invRec.company.foundedAt || new Date())
        const clientFoundedDate = new Date(invRec.client.foundedAt || new Date());

        inv.id = invRec.rawNumber || invRec.number.toString();
        inv.issueDate = new Date(invRec.createdAt.toISOString().split('T')[0]);
        inv.currency = invRec.company.currency as finance.TCurrency || 'EUR';

        let fromAdress;
        try {
            fromAdress = parseAddress(invRec.company.address || '');
        } catch (error) {
            fromAdress = {
                streetName: invRec.company.address || 'N/A',
                houseNumber: 'N/A',
            };
        }

        inv.from = {
            name: invRec.company.name,
            description: invRec.company.description || "N/A",
            status: 'active',
            foundedDate: { day: companyFoundedDate.getDay(), month: companyFoundedDate.getMonth() + 1, year: companyFoundedDate.getFullYear() },
            type: 'company',
            address: {
                streetName: fromAdress.streetName,
                houseNumber: fromAdress.houseNumber,
                city: invRec.company.city,
                postalCode: invRec.company.postalCode,
                country: invRec.company.country,
                countryCode: invRec.company.country
            },
            registrationDetails: { vatId: invRec.company.VAT || "N/A", registrationId: invRec.company.legalId || "N/A", registrationName: invRec.company.name }
        };

        let toAdress;
        try {
            toAdress = parseAddress(invRec.client.address || '');
        } catch (error) {
            toAdress = {
                streetName: invRec.client.address || 'N/A',
                houseNumber: 'N/A',
            };
        }

        inv.to = {
            name: invRec.client.name,
            description: invRec.client.description || "N/A",
            type: 'company',
            foundedDate: { day: clientFoundedDate.getDay(), month: clientFoundedDate.getMonth() + 1, year: clientFoundedDate.getFullYear() },
            status: invRec.client.isActive ? 'active' : 'planned',
            address: {
                streetName: toAdress.streetName,
                houseNumber: toAdress.houseNumber,
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

        invRec.items.forEach(item => {
            inv.addItem({
                name: item.description,
                unitQuantity: item.quantity,
                unitNetPrice: item.unitPrice,
                vatPercentage: item.vatRate || 0
            });
        });

        return inv;
    }

    async getInvoicePDFFormat(invoiceId: string, format: '' | 'pdf' | ExportFormat): Promise<Uint8Array> {
        const invRec = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { items: true, client: true, company: true, quote: true } });
        if (!invRec) throw new BadRequestException('Invoice not found');

        const pdfBuffer = await this.getInvoicePdf(invoiceId);

        if (format === 'pdf' || format === '') {
            return pdfBuffer;
        }

        const inv = await this.getInvoiceXMLFormat(invoiceId);

        return await inv.embedInPdf(Buffer.from(pdfBuffer), format)
    }

    async createInvoiceFromQuote(quoteId: string) {
        const quote = await prisma.quote.findUnique({ where: { id: quoteId }, include: { items: true } });

        if (!quote) {
            throw new BadRequestException('Quote not found');
        }

        return this.createInvoice({
            clientId: quote.clientId,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            items: quote.items,
            currency: quote.currency,
            notes: quote.notes || '',
        });
    }

    async markInvoiceAsPaid(invoiceId: string) {
        const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

        if (!invoice) {
            throw new BadRequestException('Invoice not found');
        }

        return prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: 'PAID', paidAt: new Date() }
        });
    }

    async sendInvoiceByEmail(invoiceId: string) {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                client: true,
                company: true,
                items: true,
            },
        });

        if (!invoice) {
            throw new BadRequestException('Invoice not found');
        }

        const pdfBuffer = await this.getInvoicePDFFormat(invoiceId, (invoice.company.invoicePDFFormat as ExportFormat || 'pdf'));

        const mailTemplate = await prisma.mailTemplate.findFirst({
            where: { type: 'INVOICE' },
            select: { subject: true, body: true }
        });

        if (!mailTemplate) {
            throw new BadRequestException('Email template for signature request not found.');
        }

        const envVariables = {
            APP_URL: process.env.APP_URL,
            INVOICE_NUMBER: invoice.rawNumber || invoice.number.toString(),
            COMPANY_NAME: invoice.company.name,
            CLIENT_NAME: invoice.client.name,
        };

        const mailOptions = {
            to: invoice.client.contactEmail,
            subject: mailTemplate.subject.replace(/{{(\w+)}}/g, (_, key) => envVariables[key] || ''),
            html: mailTemplate.body.replace(/{{(\w+)}}/g, (_, key) => envVariables[key] || ''),
            attachments: [{
                filename: `invoice-${invoice.rawNumber || invoice.number}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
            }],
        };

        try {
            await this.mailService.sendMail(mailOptions);
        } catch (error) {
            throw new BadRequestException('Failed to send invoice email. Please check your SMTP configuration.');
        }

        return { message: 'Invoice sent successfully' };
    }
}
