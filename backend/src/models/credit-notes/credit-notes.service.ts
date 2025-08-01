import * as Handlebars from 'handlebars';

import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCreditNoteDto, EditCreditNoteDto } from './dto/credit-notes.dto';
import { getInvertColor, getPDF } from 'src/utils/pdf';

import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { baseTemplate } from './templates/base.template';
import { formatDate } from 'src/utils/date';
import { randomUUID } from 'crypto';

@Injectable()
export class CreditNotesService {
    constructor(private readonly prisma: PrismaService, private readonly mailService: MailService) { }

    async getCreditNotes(page: string) {
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = 10;
        const skip = (pageNumber - 1) * pageSize;
        const company = await this.prisma.company.findFirst();

        if (!company) {
            throw new BadRequestException('No company found. Please create a company first.');
        }

        const CreditNotes = await this.prisma.creditNote.findMany({
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

        const totalCreditNotes = await this.prisma.creditNote.count();

        return { pageCount: Math.ceil(totalCreditNotes / pageSize), CreditNotes };
    }

    async searchCreditNotes(query: string) {
        if (!query) {
            return this.prisma.creditNote.findMany({
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

        return this.prisma.creditNote.findMany({
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

    async createCreditNote(body: CreateCreditNoteDto) {
        return false;
    }

    async createCreditNoteFromInvoice(invoiceId: string) {
        return false;
    }

    async editCreditNote(body: EditCreditNoteDto) {
        return false;
    }

    async deleteCreditNote(id: string) {
        const existingCreditNote = await this.prisma.creditNote.findUnique({ where: { id } });

        if (!existingCreditNote) {
            throw new BadRequestException('CreditNote not found');
        }

        await this.prisma.creditNoteItem.deleteMany({
            where: { creditNoteId: id },
        });

        await this.prisma.creditNote.delete({
            where: { id },
        });

        return { message: 'Credit note deleted successfully' };
    }

    async getCreditNotePdf(creditNoteId: string): Promise<Uint8Array> {
        const pdfBuffer = await getPDF("");
        return pdfBuffer;
    }


    async sendCreditNoteByEmail(id: string) {
        const CreditNote = await this.prisma.creditNote.findUnique({
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

        if (!CreditNote || !CreditNote.invoice || !CreditNote.invoice.client) {
            throw new BadRequestException('CreditNote or associated invoice/client not found');
        }

        const pdfBuffer = await this.getCreditNotePdf(id);

        const mailTemplate = await this.prisma.mailTemplate.findFirst({
            where: { type: 'CREDIT_NOTE' },
            select: { subject: true, body: true }
        });

        if (!mailTemplate) {
            throw new BadRequestException('Email template for CreditNote not found.');
        }

        const envVariables = {
            APP_URL: process.env.APP_URL,
            CreditNote_NUMBER: CreditNote.rawNumber || CreditNote.number.toString(),
            COMPANY_NAME: CreditNote.invoice.company.name,
            CLIENT_NAME: CreditNote.invoice.client.name,
        };

        const mailOptions = {
            to: CreditNote.invoice.client.contactEmail,
            subject: mailTemplate.subject.replace(/{{(\w+)}}/g, (_, key) => envVariables[key] || ''),
            html: mailTemplate.body.replace(/{{(\w+)}}/g, (_, key) => envVariables[key] || ''),
            attachments: [{
                filename: `CreditNote-${CreditNote.rawNumber || CreditNote.number}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
            }],
        };

        try {
            await this.mailService.sendMail(mailOptions);
        } catch (error) {
            throw new BadRequestException('Failed to send CreditNote email. Please check your SMTP configuration.');
        }

        return { message: 'CreditNote sent successfully' };
    }
}
