import { Injectable, OnModuleInit } from '@nestjs/common';

import { PrismaClient } from '@prisma/client';
import { formatPattern } from 'src/utils/pdf';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        await this.$connect();

        this.$use(async (params, next) => {
            if (['Quote', 'Invoice', 'Receipt'].includes(params.model || '') && ['findMany', 'create', 'update'].includes(params.action) && params.args?.where?.rawNumber === null) {
                return next(params);
            }

            if (['Quote', 'Invoice', 'Receipt'].includes(params.model || '') && params.action === 'update') {
                return next(params);
            }

            let toUpdate: any = await this.quote.findMany({
                where: {
                    rawNumber: null
                },
                include: {
                    company: true
                }
            });

            await Promise.all(toUpdate.map(async (quote) => {
                const formattedNumber = await formatPattern('quote', quote.number, quote.createdAt);
                await this.quote.update({
                    where: { id: quote.id },
                    data: {
                        rawNumber: formattedNumber
                    }
                });
            }));

            toUpdate = await this.invoice.findMany({
                where: {
                    rawNumber: null
                },
                include: {
                    company: true
                }
            })

            await Promise.all(toUpdate.map(async (invoice) => {
                const formattedNumber = await formatPattern('invoice', invoice.number, invoice.createdAt);
                await this.invoice.update({
                    where: { id: invoice.id },
                    data: {
                        rawNumber: formattedNumber
                    }
                });
            }));


            toUpdate = await this.receipt.findMany({
                where: {
                    rawNumber: null
                },
                include: {
                    invoice: {
                        include: {
                            company: true
                        }
                    }
                }
            })

            await Promise.all(toUpdate.map(async (receipt) => {
                const formattedNumber = await formatPattern('receipt', receipt.number, receipt.createdAt);
                await this.receipt.update({
                    where: { id: receipt.id },
                    data: {
                        rawNumber: formattedNumber
                    }
                });
            }));


            return next(params);
        });
    }
}