import * as nodemailer from 'nodemailer';

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SignaturesService {
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

    async getSignature(signatureId: string) {
        const signature = await this.prisma.signature.findUnique({
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
        const quote = await this.prisma.quote.findUnique({
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
            throw new Error('Quote not found or client information is missing.');
        }

        const signature = await this.prisma.signature.create({
            data: {
                quoteId,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Signature valid for 30 days
            },
        });

        await this.sendSignatureEmail(signature.id);

        await this.prisma.quote.update({
            where: { id: quoteId },
            data: {
                status: 'SENT',
            },
        });

        return { message: 'Signature successfully created and email sent.', signature };
    }

    async generateOTPCode(signatureId: string) {
        const signature = await this.prisma.signature.findUnique({
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
            throw new Error('Quote not found or client information is missing.');
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        await this.prisma.signature.update({
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
        const signature = await this.prisma.signature.findUnique({
            where: { id: signatureId, isActive: true },
            select: {
                quoteId: true,
                quote: {
                    select: {
                        number: true,
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
            throw new Error('Quote not found or client information is missing.');
        }

        await this.prisma.signature.updateMany({
            where: { quoteId: signature.quoteId, isActive: true, id: { not: signatureId } },
            data: { isActive: false },
        });

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: signature.quote.client.contactEmail,
            subject: 'Signature Request for Quote',
            text: `Please sign the quote by clicking on the following link: ${process.env.APP_URL}/signature/${signatureId}`,
            html: `<p>Please sign the quote: <a href="${process.env.APP_URL}/signature/${signatureId}">#${signature.quote.number}</a>.</p>`,
        };

        await this.transporter.sendMail(mailOptions)
            .then(() => { })
            .catch(error => {
                console.error('Error sending signature email:', error);
                throw new Error('Failed to send signature email.');
            });

        return { message: 'Signature email sent successfully.' };
    }

    async sendOtpToUser(email: string, otpCode: string) {
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject: 'Your OTP Code for Quote Signing',
            text: `Your OTP code is: ${otpCode}. It is valid for 15 minutes.`,
        };

        await this.transporter.sendMail(mailOptions)
            .then(() => console.log('OTP sent successfully'))
            .catch(error => {
                console.error('Error sending OTP:', error);
                throw new Error('Failed to send OTP code.');
            });

        return true;
    }

    async signQuote(signatureId: string, otpCode: string) {
        const signature = await this.prisma.signature.findFirst({
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
            throw new Error('Invalid or expired OTP code.');
        }

        await this.prisma.signature.update({
            where: { id: signature.id },
            data: {
                otpUsed: true,
                signedAt: new Date(),
            },
        });

        await this.prisma.quote.update({
            where: { id: signature.quoteId },
            data: {
                status: 'SIGNED',
            },
        });

        return { message: 'Quote signed successfully.' };
    }
}
