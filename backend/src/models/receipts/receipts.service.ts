import * as Handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';

import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateReceiptDto, EditReceiptDto } from './dto/receipts.dto';
import { formatPattern, getPDF } from 'src/utils/pdf';

import { PrismaService } from 'src/prisma/prisma.service';
import { baseTemplate } from './templates/base.template';
import { formatDate } from 'src/utils/date';

@Injectable()
export class ReceiptsService {
    private transporter: nodemailer.Transporter;
    constructor(private readonly prisma: PrismaService) {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: 587,
            secure: false, // true si port 465
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    }

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
                        id: item.id,
                        invoiceId: body.invoiceId,
                        amountPaid: +item.amountPaid,
                    })),
                },
                totalPaid: body.items.reduce((sum, item) => sum + +item.amountPaid, 0),
            },
            include: {
                items: true,
            },
        });

        return receipt;
    }

    async createReceiptFromInvoice(invoiceId: string) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId }
        });
        if (!invoice) {
            throw new BadRequestException('Invoice not found');
        }

        return await this.createReceipt({
            invoiceId: invoice.id,
            items: [],
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

        const updatedReceipt = await this.prisma.receipt.update({
            where: { id: body.id },
            data: {
                items: {
                    deleteMany: {},
                    create: body.items.map(item => ({
                        id: item.id,
                        invoiceId: existingReceipt.invoiceId,
                        amountPaid: +item.amountPaid,
                    })),
                },
                totalPaid: body.items.reduce((sum, item) => sum + +item.amountPaid, 0),
                paymentMethod: body.paymentMethod,
                paymentDetails: body.paymentDetails,
            },
            include: {
                items: true,
            },
        });

        return updatedReceipt;
    }

    async deleteReceipt(id: string) {
        const existingReceipt = await this.prisma.receipt.findUnique({ where: { id } });

        if (!existingReceipt) {
            throw new BadRequestException('Receipt not found');
        }

        return this.prisma.receipt.delete({
            where: { id },
        });
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
            amount: receipt.totalPaid.toFixed(2),

            items: receipt.items.map(item => ({
                description: receipt.invoice.items.find(i => i.id === item.id)?.description || 'N/A',
                amount: item.amountPaid.toFixed(2),
            })),

            fontFamily: pdfConfig.fontFamily ?? 'Inter',
            primaryColor: pdfConfig.primaryColor ?? '#0ea5e9',
            secondaryColor: pdfConfig.secondaryColor ?? '#f3f4f6',
            includeLogo: !!pdfConfig.logoB64,
            logoB64: pdfConfig.logoB64 ?? '',
            padding: pdfConfig.padding ?? 40,

            labels: {
                receipt: pdfConfig.receipt,
                receiptNumber: pdfConfig.receiptNumber,
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
            from: `${receipt.invoice.company.name} <${receipt.invoice.company.email}>`,
            to: receipt.invoice.client.contactEmail,
            subject: mailTemplate.subject.replace(/{{(\w+)}}/g, (_, key) => envVariables[key] || ''),
            html: mailTemplate.body.replace(/{{(\w+)}}/g, (_, key) => envVariables[key] || ''),
            attachments: [{
                filename: `receipt-${receipt.rawNumber || receipt.number}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
            }],
        };

        await this.transporter.sendMail(mailOptions)
            .then(() => { })
            .catch(error => {
                console.error('Error sending receipt email:', error);
                throw new BadRequestException('Failed to send receipt email.');
            });

        return { message: 'Receipt sent successfully' };
    }
}
