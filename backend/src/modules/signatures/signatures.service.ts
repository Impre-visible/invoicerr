import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PluginType, WebhookEvent } from '@prisma/client';

import { ISigningProvider } from '@/plugins/signing/types';
import { MailService } from '@/mail/mail.service';
import { PluginsService } from '../plugins/plugins.service';
import { WebhookDispatcherService } from '../webhooks/webhook-dispatcher.service';
import prisma from '@/prisma/prisma.service';

@Injectable()
export class SignaturesService {
    private readonly logger: Logger;

    constructor(
        private readonly mailService: MailService,
        private readonly pluginsService: PluginsService,
        private readonly webhookDispatcher: WebhookDispatcherService
    ) {
        this.logger = new Logger(SignaturesService.name);
    }

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
                id: true,
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


        const signatureId = await this.sendSignatureEmail(quote.id);

        await prisma.quote.update({
            where: { id: quoteId },
            data: {
                status: 'SENT',
            },
        });

        try {
            await this.webhookDispatcher.dispatch(WebhookEvent.SIGNATURE_CREATED, {
                quoteId: quote.id,
                signatureId,
                client: quote.client,
            });
        } catch (error) {
            this.logger.error('Failed to dispatch SIGNATURE_CREATED webhook', error);
        }

        return { message: 'Signature successfully created and email sent.', signature: { id: signatureId } };
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

        try {
            await this.webhookDispatcher.dispatch(WebhookEvent.SIGNATURE_OTP_GENERATED, {
                signatureId,
                quoteId: signature.quoteId,
                clientEmail: signature.quote.client.contactEmail,
                otpCode,
            });
        } catch (error) {
            this.logger.error('Failed to dispatch SIGNATURE_OTP_GENERATED webhook', error);
        }

        return { message: 'OTP code generated successfully.' };
    }

    private async sendSignatureEmailWithProvider(provider: ISigningProvider, quoteId: string): Promise<string> {
        if (provider && typeof provider.requestSignature == 'function') {
            return provider.requestSignature({
                id: quoteId,
                title: `Signature for Quote ${quoteId}`,
                fileUrl: `https://example.com/quotes/${quoteId}/file.pdf`,
                signers: ['<SIGNER_EMAIL>']
            });
        }
        return '';
    }

    async sendSignatureEmail(quoteId: string): Promise<string> {
        const provider = await this.pluginsService.getProviderByType<ISigningProvider>(PluginType.SIGNING);
        if (provider && typeof provider.requestSignature == 'function') {
            return this.sendSignatureEmailWithProvider(provider, quoteId);
        }
        const signature = await prisma.signature.create({
            data: {
                quoteId,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Signature valid for 30 days
            },
            select: {
                id: true,
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
            where: { quoteId: signature.quoteId, isActive: true, id: { not: signature.id } },
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
            SIGNATURE_URL: `${process.env.APP_URL}/signature/${signature.id}`,
            SIGNATURE_ID: signature.id,
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

        return signature.id;
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

        try {
            await this.webhookDispatcher.dispatch(WebhookEvent.SIGNATURE_COMPLETED, {
                signatureId,
                quoteId: signature.quoteId,
                signedAt: new Date(),
            });
        } catch (error) {
            this.logger.error('Failed to dispatch SIGNATURE_COMPLETED webhook', error);
        }

        return { message: 'Quote signed successfully.' };
    }
}
