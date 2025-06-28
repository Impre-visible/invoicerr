import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import nodemailer from 'nodemailer';

@Injectable()
export class SignaturesService {
    constructor(private readonly prisma: PrismaService) { }

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
                signedAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Signature valid for 30 days
            },
        });

        return { message: 'Signature created successfully.', signature };
    }

    async generateOTPCode(signatureId: string) {
        const signature = await this.prisma.signature.findUnique({
            where: { id: signatureId },
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

        await this.prisma.signature.create({
            data: {
                quoteId: signature.quoteId,
                otpCode,
                otpUsed: false,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000), // OTP valid for 15 minutes
            },
        });

        await this.sendOtpToUser(signature.quote.client.contactEmail, otpCode);

        return { message: 'OTP code generated successfully.' };
    }

    async sendOtpToUser(email: string, otpCode: string) {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: 587,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Your OTP Code for Quote Signing',
            text: `Your OTP code is: ${otpCode}. It is valid for 15 minutes.`,
        };

        await transporter.sendMail(mailOptions)
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

        return { message: 'Quote signed successfully.' };
    }
}
