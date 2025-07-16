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
                items: true
            },
        });

        const returnedReceipts = await Promise.all(receipts.map(async (receipt) => {
            return {
                ...receipt,
                number: await formatPattern(company.receiptNumberFormat, receipt.number, receipt.createdAt),
            }
        }));

        const totalReceipts = await this.prisma.receipt.count();

        return { pageCount: Math.ceil(totalReceipts / pageSize), receipts: returnedReceipts };
    }

    async searchReceipts(query: string) {
        if (!query) {
            return this.prisma.receipt.findMany({
                take: 10,
                orderBy: {
                    number: 'asc',
                },
                include: {
                    items: true
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
                items: true
            },
        });
    }

    async createReceipt(body: CreateReceiptDto) {
    }

    async editReceipt(body: EditReceiptDto) {
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
