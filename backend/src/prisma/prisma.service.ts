import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import { formatPattern } from 'src/utils/pdf';

const clientExtension = Prisma.defineExtension((client) => {
    return client.$extends({
        query: {
            quote: {
                async findMany({ args, query }) {
                    const result = await query(args);

                    if (args?.where?.rawNumber === null) {
                        return result;
                    }

                    const toUpdate = result.filter((quote) => quote.rawNumber === null);

                    await Promise.all(toUpdate.map(async (quote) => {
                        if (quote.company && quote.company.quoteNumberFormat && quote.number !== undefined && quote.createdAt) {
                            const formattedNumber = await formatPattern(quote.company.quoteNumberFormat, quote.number, new Date(quote.createdAt.toString()));
                            await client.quote.update({
                                where: { id: quote.id },
                                data: {
                                    rawNumber: formattedNumber
                                }
                            });
                        }
                    }));

                    return result;
                }
            },
            invoice: {
                async findMany({ args, query }) {
                    const result = await query(args);

                    const toUpdate = result.filter((invoice) => invoice.rawNumber === null);

                    await Promise.all(toUpdate.map(async (invoice) => {
                        if (invoice.company && invoice.company.invoiceNumberFormat && invoice.number !== undefined && invoice.createdAt) {
                            const formattedNumber = await formatPattern(invoice.company.invoiceNumberFormat, invoice.number, new Date(invoice.createdAt.toString()));
                            await client.invoice.update({
                                where: { id: invoice.id },
                                data: {
                                    rawNumber: formattedNumber
                                }
                            });
                        }
                    }));

                    return result;
                }
            },
            receipt: {
                async findMany({ args, query }) {
                    const result = await query(args);

                    const toUpdate = result.filter((receipt) => receipt.rawNumber === null);

                    await Promise.all(toUpdate.map(async (receipt) => {
                        if (receipt.invoice && receipt.invoice.company && receipt.invoice.company.receiptNumberFormat && receipt.number !== undefined && receipt.createdAt) {
                            const formattedNumber = await formatPattern(receipt.invoice.company.receiptNumberFormat, receipt.number, new Date(receipt.createdAt.toString()));
                            await client.receipt.update({
                                where: { id: receipt.id },
                                data: {
                                    rawNumber: formattedNumber
                                }
                            });
                        }
                    }));

                    return result;
                }
            }
        }
    });
});

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        super();
        this.$extends(clientExtension);
    }

    async onModuleInit() {
        await this.$connect();
    }
}