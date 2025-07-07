import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RecurringInvoicesService {
    constructor(private readonly prisma: PrismaService) { }

    async getRecurringInvoices(page: string = "1") {
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = 10;
        const skip = (pageNumber - 1) * pageSize;

        const recurringInvoices = await this.prisma.recurringInvoice.findMany({
            skip,
            take: pageSize
        });

        const totalCount = await this.prisma.recurringInvoice.count();

        return {
            data: recurringInvoices,
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / pageSize),
        };
    }

    async createRecurringInvoice(data: any) {
        //TODO: Implement the logic to create a recurring invoice
        return "Recurring invoice created successfully";
    }
}
