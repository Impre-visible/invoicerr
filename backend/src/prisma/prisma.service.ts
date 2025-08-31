import { Prisma, PrismaClient } from '@prisma/client';

import { formatPattern } from 'src/utils/pdf';

const prisma = new PrismaClient().$extends({
    query: {
        $allModels: {
            async findMany({ model, operation, args, query }) {
                if (
                    ['Quote', 'Invoice', 'Receipt'].includes(model) &&
                    args?.where &&
                    (args.where as Prisma.QuoteWhereInput | Prisma.InvoiceWhereInput | Prisma.ReceiptWhereInput).rawNumber! === null
                ) {
                    return query(args);
                }

                // Exécution de la requête
                const result = await query(args);

                // Mise à jour automatique des rawNumber manquants
                if (['Quote', 'Invoice', 'Receipt'].includes(model)) {
                    if (model === 'Quote') {
                        const toUpdate = await prisma.quote.findMany({
                            where: { rawNumber: null },
                            include: { company: true },
                        });
                        await Promise.all(
                            toUpdate.map(async (quote) => {
                                const formattedNumber = await formatPattern(
                                    'quote',
                                    quote.number,
                                    quote.createdAt,
                                );
                                await prisma.quote.update({
                                    where: { id: quote.id },
                                    data: { rawNumber: formattedNumber },
                                });
                            }),
                        );
                    }

                    if (model === 'Invoice') {
                        const toUpdate = await prisma.invoice.findMany({
                            where: { rawNumber: null },
                            include: { company: true },
                        });
                        await Promise.all(
                            toUpdate.map(async (invoice) => {
                                const formattedNumber = await formatPattern(
                                    'invoice',
                                    invoice.number,
                                    invoice.createdAt,
                                );
                                await prisma.invoice.update({
                                    where: { id: invoice.id },
                                    data: { rawNumber: formattedNumber },
                                });
                            }),
                        );
                    }

                    if (model === 'Receipt') {
                        const toUpdate = await prisma.receipt.findMany({
                            where: { rawNumber: null },
                            include: { invoice: { include: { company: true } } },
                        });
                        await Promise.all(
                            toUpdate.map(async (receipt) => {
                                const formattedNumber = await formatPattern(
                                    'receipt',
                                    receipt.number,
                                    receipt.createdAt,
                                );
                                await prisma.receipt.update({
                                    where: { id: receipt.id },
                                    data: { rawNumber: formattedNumber },
                                });
                            }),
                        );
                    }
                }

                return result;
            },

            async create({ model, args, query }) {
                const result = (await query(args));

                if (['Quote', 'Invoice', 'Receipt'].includes(model)) {
                    const typedResult = result as Prisma.QuoteGetPayload<{}> | Prisma.InvoiceGetPayload<{}> | Prisma.ReceiptGetPayload<{}>;
                    if (!typedResult.rawNumber) {
                        const formattedNumber = await formatPattern(
                            (model.toLowerCase() as 'quote' | 'invoice' | 'receipt'),
                            typedResult.number,
                            typedResult.createdAt,
                        );
                        await prisma[model.toLowerCase()].update({
                            where: { id: result.id },
                            data: { rawNumber: formattedNumber },
                        });
                    }
                }

                return result;
            },

            async update({ model, args, query }) {
                const result = await query(args);

                if (['Quote', 'Invoice', 'Receipt'].includes(model)) {
                    const typedResult = result as Prisma.QuoteGetPayload<{}> | Prisma.InvoiceGetPayload<{}> | Prisma.ReceiptGetPayload<{}>;
                    if (!typedResult.rawNumber) {
                        const formattedNumber = await formatPattern(
                            (model.toLowerCase() as 'quote' | 'invoice' | 'receipt'),
                            typedResult.number,
                            typedResult.createdAt,
                        );
                        await prisma[model.toLowerCase()].update({
                            where: { id: result.id },
                            data: { rawNumber: formattedNumber },
                        });
                    }
                }

                return result;
            },
        },
    },
});

export default prisma;
