import * as Handlebars from 'handlebars';

import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateReceiptDto, EditReceiptDto } from './dto/receipts.dto';
import { formatPattern, getPDF } from 'src/utils/pdf';

import { PrismaService } from 'src/prisma/prisma.service';
import { baseTemplate } from './templates/base.template';
import { formatDate } from 'src/utils/date';

@Injectable()
export class ReceiptsService {
    constructor(private readonly prisma: PrismaService) { }

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

    /*
    async getReceiptPdf(id: string): Promise<Uint8Array> {

    }
    */
}
