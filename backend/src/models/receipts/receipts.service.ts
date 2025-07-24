import * as Handlebars from 'handlebars';

import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateReceiptDto, EditReceiptDto } from './dto/receipts.dto';
import { getInvertColor, getPDF } from 'src/utils/pdf';

import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { baseTemplate } from './templates/base.template';
import { formatDate } from 'src/utils/date';
import { randomUUID } from 'crypto';

@Injectable()
export class ReceiptsService {
    constructor(private readonly prisma: PrismaService, private readonly mailService: MailService) { }

    async getReceipts(page: string) {
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = 10;
        const skip = (pageNumber - 1) * pageSize;
        const company = await this.prisma.company.findFirst();

        if (!company) {
            throw new BadRequestException('No company found. Please create a company first.');
        }

        const receipts = await this.prisma.receipt.findMany({
            skip,
            take: pageSize,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                items: true,
                invoice: {
                    include: {
                        items: true,
                        client: true,
                        quote: true,
                    }
                }
            },
        });

        const totalReceipts = await this.prisma.receipt.count();

        return { pageCount: Math.ceil(totalReceipts / pageSize), receipts };
    }

    async searchReceipts(query: string) {
        if (!query) {
            return this.prisma.receipt.findMany({
                take: 10,
                orderBy: {
                    number: 'asc',
                },
                include: {
                    items: true,
                    invoice: {
                        include: {
                            client: true,
                            quote: true,
                        }
                    }
                },
            });
        }

        return this.prisma.receipt.findMany({
            where: {
                OR: [
                    { invoice: { quote: { title: { contains: query } } } },
                    { invoice: { client: { name: { contains: query } } } },
                ],
            },
            take: 10,
            orderBy: {
                number: 'asc',
            },
            include: {
                items: true,
                invoice: {
                    include: {
                        client: true,
                        quote: true,
                    }
                }
            },
        });
    }

    private async checkInvoiceAfterReceipt(invoiceId: string) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId }
        });

        if (!invoice) {
            throw new BadRequestException('Invoice not found');
        }

        if (invoice.status === 'UNPAID') {
            const receipts = await this.prisma.receipt.findMany({
                where: { invoiceId },
                select: { totalPaid: true },
            });

            const totalPaid = receipts.reduce((sum, receipt) => sum + receipt.totalPaid, 0);
            if (totalPaid >= invoice.totalTTC) {
                await this.prisma.invoice.update({
                    where: { id: invoiceId },
                    data: { status: 'PAID' },
                });
            } else {
                await this.prisma.invoice.update({
                    where: { id: invoiceId },
                    data: { status: 'UNPAID' },
                });
            }
        }
    }

    async createReceipt(body: CreateReceiptDto) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: body.invoiceId },
            include: {
                company: true,
                client: true,
                items: true,
            },
        });

        if (!invoice) {
            throw new BadRequestException('Invoice not found');
        }

        const receipt = await this.prisma.receipt.create({
            data: {
                invoiceId: body.invoiceId,
                items: {
                    create: body.items.map(item => ({
                        invoiceItemId: item.invoiceItemId,
                        amountPaid: +item.amountPaid,
                    })),
                },
                totalPaid: body.items.reduce((sum, item) => sum + +item.amountPaid, 0),
            },
            include: {
                items: true,
            },
        });

        await this.checkInvoiceAfterReceipt(invoice.id)

        return receipt;
    }

    async createReceiptFromInvoice(invoiceId: string) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                items: true
            },
        });
        if (!invoice) {
            throw new BadRequestException('Invoice not found');
        }

        return await this.createReceipt({
            invoiceId: invoice.id,
            items: invoice.items.map(item => ({
                invoiceItemId: item.id,
                amountPaid: (item.quantity * item.unitPrice * (1 + item.vatRate / 100)).toFixed(2),
            })),
            paymentMethod: invoice.paymentMethod || '',
            paymentDetails: invoice.paymentDetails || '',
        });
    }

    async editReceipt(body: EditReceiptDto) {
        const existingReceipt = await this.prisma.receipt.findUnique({
            where: { id: body.id },
            include: {
                items: true,
            },
        });

        if (!existingReceipt) {
            throw new BadRequestException('Receipt not found');
        }

        console.log('Editing receipt:', body)

        const updatedReceipt = await this.prisma.receipt.update({
            where: { id: existingReceipt.id },
            data: {
                items: {
                    deleteMany: { receiptId: existingReceipt.id },
                    createMany: {
                        data: body.items.map(item => ({
                            id: randomUUID(),
                            invoiceItemId: item.invoiceItemId,
                            amountPaid: +item.amountPaid,
                        })),
                    },
                },
                totalPaid: body.items.reduce((sum, item) => sum + +item.amountPaid, 0),
                paymentMethod: body.paymentMethod,
                paymentDetails: body.paymentDetails,
            },
            include: {
                items: true,
            },
        });

        await this.checkInvoiceAfterReceipt(existingReceipt.invoiceId);

        return updatedReceipt;
    }

    async deleteReceipt(id: string) {
        const existingReceipt = await this.prisma.receipt.findUnique({ where: { id } });

        if (!existingReceipt) {
            throw new BadRequestException('Receipt not found');
        }

        await this.prisma.receiptItem.deleteMany({
            where: { receiptId: id },
        });

        await this.prisma.receipt.delete({
            where: { id },
        });

        await this.checkInvoiceAfterReceipt(existingReceipt.invoiceId);

        return { message: 'Receipt deleted successfully' };
    }

    async getReceiptPdf(receiptId: string): Promise<Uint8Array> {
        const receipt = await this.prisma.receipt.findUnique({
            where: { id: receiptId },
            include: {
                items: true,
                invoice: {
                    include: {
                        items: true,
                        client: true,
                        company: {
                            include: { pdfConfig: true },
                        },
                    },
                }
            },
        });

        if (!receipt) {
            throw new BadRequestException('Receipt not found');
        }

        const { pdfConfig } = receipt.invoice.company;
        const template = Handlebars.compile(baseTemplate); // ton template reçu ici

        const html = template({
            number: receipt.rawNumber || receipt.number.toString(),
            paymentDate: formatDate(receipt.invoice.company, new Date()), // TODO: Add a payment date
            invoiceNumber: receipt.invoice?.rawNumber || receipt.invoice?.number?.toString() || '',
            client: receipt.invoice.client,
            company: receipt.invoice.company,
            currency: receipt.invoice.currency,
            paymentMethod: receipt.paymentMethod,
            totalAmount: receipt.totalPaid.toFixed(2),

            items: receipt.items.map(item => ({
                description: receipt.invoice.items.find(i => i.id === item.invoiceItemId)?.description || 'N/A',
                amount: item.amountPaid.toFixed(2),
            })),

            fontFamily: pdfConfig.fontFamily ?? 'Inter',
            primaryColor: pdfConfig.primaryColor ?? '#0ea5e9',
            secondaryColor: pdfConfig.secondaryColor ?? '#f3f4f6',
            tableTextColor: getInvertColor(pdfConfig.secondaryColor),
            includeLogo: !!pdfConfig.logoB64,
            logoB64: pdfConfig.logoB64 ?? '',
            padding: pdfConfig.padding ?? 40,

            labels: {
                receipt: pdfConfig.receipt,
                paymentDate: pdfConfig.paymentDate,
                receivedFrom: pdfConfig.receivedFrom,
                invoiceRefer: pdfConfig.invoiceRefer,
                description: pdfConfig.description,
                totalReceived: pdfConfig.totalReceived,
                paymentMethod: pdfConfig.paymentMethod,
                legalId: pdfConfig.legalId,
                VATId: pdfConfig.VATId,
            },
        });

        const pdfBuffer = await getPDF(html);
        return pdfBuffer;
    }


    async sendReceiptByEmail(id: string) {
        const receipt = await this.prisma.receipt.findUnique({
            where: { id },
            include: {
                invoice: {
                    include: {
                        client: true,
                        company: true,
                    }
                }
            },
        });

        if (!receipt || !receipt.invoice || !receipt.invoice.client) {
            throw new BadRequestException('Receipt or associated invoice/client not found');
        }

        const pdfBuffer = await this.getReceiptPdf(id);

        const mailTemplate = await this.prisma.mailTemplate.findFirst({
            where: { type: 'RECEIPT' },
            select: { subject: true, body: true }
        });

        if (!mailTemplate) {
            throw new BadRequestException('Email template for receipt not found.');
        }

        const envVariables = {
            APP_URL: process.env.APP_URL,
            RECEIPT_NUMBER: receipt.rawNumber || receipt.number.toString(),
            COMPANY_NAME: receipt.invoice.company.name,
            CLIENT_NAME: receipt.invoice.client.name,
        };

        const mailOptions = {
            to: receipt.invoice.client.contactEmail,
            subject: mailTemplate.subject.replace(/{{(\w+)}}/g, (_, key) => envVariables[key] || ''),
            html: mailTemplate.body.replace(/{{(\w+)}}/g, (_, key) => envVariables[key] || ''),
            attachments: [{
                filename: `receipt-${receipt.rawNumber || receipt.number}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
            }],
        };

        try {
            await this.mailService.sendMail(mailOptions);
        } catch (error) {
            throw new BadRequestException('Failed to send receipt email. Please check your SMTP configuration.');
        }

        return { message: 'Receipt sent successfully' };
    }
}
