import { MailService } from '@/mail/mail.service';
import prisma from '@/prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class SignaturesService {
    constructor(private readonly mailService: MailService) { }

    async getSignature(signatureId: string) {
        const signature = await prisma.signature.findUnique({
            where: { id: signatureId },
            select: {
                id: true,
                isActive: true,
                quoteId: true,
                signedAt: true,
                expiresAt: true,
                quote: {
                    include: {
                        client: true,
                    }
                }
            }
        });

        return signature;
    }

    async createSignature(quoteId: string) {
        const quote = await prisma.quote.findUnique({
            where: { id: quoteId },
            select: {
                client: {
                    select: {
                        contactEmail: true
                    }
                }
            }
        });

        if (!quote || !quote.client || !quote.client.contactEmail) {
            throw new BadRequestException('Quote not found or client information is missing.');
        }

        const signature = await prisma.signature.create({
            data: {
                quoteId,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Signature valid for 30 days
            },
        });

        await this.sendSignatureEmail(signature.id);

        await prisma.quote.update({
            where: { id: quoteId },
            data: {
                status: 'SENT',
            },
        });

        return { message: 'Signature successfully created and email sent.', signature };
    }

    async generateOTPCode(signatureId: string) {
        const signature = await prisma.signature.findFirst({
            where: { id: signatureId, isActive: true },
            select: {
                quoteId: true,
                quote: {
                    select: {
                        client: {
                            select: {
                                contactEmail: true
                            }
                        }
                    }
                }
            }
        });

        if (!signature || !signature.quote || !signature.quote.client || !signature.quote.client.contactEmail) {
            throw new BadRequestException('Quote not found or client information is missing.');
        }

        const otpCode = Math.floor(10000000 + Math.random() * 90000000).toString();

        await prisma.signature.update({
            where: { id: signatureId },
            data: {
                otpCode,
                otpUsed: false,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000), // OTP valid for 15 minutes
            },
        });

        await this.sendOtpToUser(signature.quote.client.contactEmail, otpCode);

        return { message: 'OTP code generated successfully.' };
    }

    async sendSignatureEmail(signatureId: string) {
        const signature = await prisma.signature.findFirst({
            where: { id: signatureId, isActive: true },
            select: {
                quoteId: true,
                quote: {
                    select: {
                        number: true,
                        company: true,
                        client: {
                            select: {
                                contactEmail: true
                            }
                        }
                    }
                }
            }
        });

        if (!signature || !signature.quote || !signature.quote.client || !signature.quote.client.contactEmail) {
            throw new BadRequestException('Quote not found or client information is missing.');
        }

        await prisma.signature.updateMany({
            where: { quoteId: signature.quoteId, isActive: true, id: { not: signatureId } },
            data: { isActive: false },
        });

        const mailTemplate = await prisma.mailTemplate.findFirst({
            where: { type: 'SIGNATURE_REQUEST', companyId: signature.quote.company.id },
            select: { subject: true, body: true }
        });

        if (!mailTemplate) {
            throw new BadRequestException('Email template for signature request not found.');
        }

        const envVariables = {
            APP_URL: process.env.APP_URL,
            SIGNATURE_URL: `${process.env.APP_URL}/signature/${signatureId}`,
            SIGNATURE_ID: signatureId,
            SIGNATURE_NUMBER: signature.quote.number,
        };

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: signature.quote.client.contactEmail,
            subject: mailTemplate.subject.replace(/{{(\w+)}}/g, (_, key) => envVariables[key] || ''),
            html: mailTemplate.body.replace(/{{(\w+)}}/g, (_, key) => envVariables[key] || ''),
        };

        try {
            await this.mailService.sendMail(mailOptions)
        } catch (error) {
            throw new BadRequestException('Failed to send signature email. Please check your SMTP configuration.');
        }

        return { message: 'Signature email sent successfully.' };
    }

    async sendOtpToUser(email: string, otpCode: string) {
        const signature = await prisma.signature.findFirst({
            where: { otpCode, otpUsed: false, isActive: true },
            select: { id: true, quote: { select: { company: true } } }
        });

        if (!signature) {
            throw new BadRequestException('Signature not found or OTP code is invalid.');
        }

        const mailTemplate = await prisma.mailTemplate.findFirst({
            where: { type: 'VERIFICATION_CODE', companyId: signature.quote.company.id },
            select: { subject: true, body: true }
        });

        if (!mailTemplate) {
            throw new BadRequestException('Email template for OTP code not found.');
        }

        const envVariables = {
            OTP_CODE: `${otpCode.slice(0, 4)}-${otpCode.slice(4, 8)}`,
        };

        const mailOptions = {
            to: email,
            subject: mailTemplate.subject.replace(/{{(\w+)}}/g, (_, key) => envVariables[key] || ''),
            html: mailTemplate.body.replace(/{{(\w+)}}/g, (_, key) => envVariables[key] || ''),
        };

        try {
            await this.mailService.sendMail(mailOptions)
        } catch (error) {
            throw new BadRequestException('Failed to send OTP email. Please check your SMTP configuration.');
        }

        return true;
    }

    async signQuote(signatureId: string, otpCode: string) {
        const signature = await prisma.signature.findFirst({
            where: {
                id: signatureId,
                otpCode,
                otpUsed: false,
                isActive: true,
                expiresAt: {
                    gte: new Date(),
                },
            },
        });

        if (!signature) {
            throw new BadRequestException('Invalid or expired OTP code.');
        }

        await prisma.signature.update({
            where: { id: signature.id },
            data: {
                otpUsed: true,
                signedAt: new Date(),
            },
        });

        await prisma.quote.update({
            where: { id: signature.quoteId },
            data: {
                status: 'SIGNED',
            },
        });

        return { message: 'Quote signed successfully.' };
    }
}
