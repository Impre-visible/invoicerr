import { BadRequestException, Injectable } from '@nestjs/common';
import { EditCompanyDto, PDFConfig } from './dto/company.dto';
import { MailTemplate, MailTemplateType } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { randomUUID } from 'crypto';

export interface EmailTemplate {
    dbId: string
    id: string
    companyId: string
    name: string
    subject: string
    body: string
    variables: Record<string, string>
}

@Injectable()
export class CompanyService {
    constructor(private readonly prisma: PrismaService) { }

    async getCompanyInfo() {
        const company = await this.prisma.company.findFirst({ include: { emailTemplates: true } });

        if (!company) {
            return null
        }

        if (!company.emailTemplates.find(template => template.type === MailTemplateType.SIGNATURE_REQUEST)) {
            await this.prisma.mailTemplate.create({
                data: {
                    type: MailTemplateType.SIGNATURE_REQUEST,
                    subject: 'Please sign document #{{SIGNATURE_NUMBER}}',
                    body: '<h2>Document Signature Required</h2><p>Hello,</p><p>You have been requested to sign the following document:</p><div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">  <strong>Document:</strong> {{SIGNATURE_NUMBER}}<br>  <strong>Signature ID:</strong> {{SIGNATURE_ID}}</div><p>Please click the button below to review and sign the document:</p><div style="text-align: center; margin: 30px 0;">  <a href="{{SIGNATURE_URL}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Sign Document</a></div><p>If you have any questions, please don\'t hesitate to contact us.</p><p>Best regards,<br>The Invoicerr Team</p><hr><p style="font-size: 12px; color: #666;">This email was sent from {{APP_URL}}</p>',
                    companyId: company.id
                }
            });
        }

        if (!company.emailTemplates.find(template => template.type === MailTemplateType.VERIFICATION_CODE)) {
            await this.prisma.mailTemplate.create({
                data: {
                    type: MailTemplateType.VERIFICATION_CODE,
                    subject: 'Your verification code',
                    body: '<p>Hello,</p><p>Here is your verification code:</p><div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">  <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 4px; font-family: monospace;">{{OTP_CODE}}</div></div><p>This code will expire in 10 minutes. Please enter it in the application to complete your verification.</p><p>If you didn\'t request this code, please ignore this email.</p><p>Best regards,<br>The Invoicerr Team</p>',
                    companyId: company.id
                }
            });
        }

        if (!company.emailTemplates.find(template => template.type === MailTemplateType.INVOICE)) {
            await this.prisma.mailTemplate.create({
                data: {
                    type: MailTemplateType.INVOICE,
                    subject: 'Invoice #{{INVOICE_NUMBER}} from {{COMPANY_NAME}}',
                    body: '<p>Dear {{CLIENT_NAME}},</p><p>Please find attached the invoice #{{INVOICE_NUMBER}} from {{COMPANY_NAME}}.</p><p>Thank you for your business!</p><p>Best regards,<br>{{COMPANY_NAME}}</p><hr><p style="font-size: 12px; color: #666;">This email was sent from {{APP_URL}}</p>',
                    companyId: company.id
                }
            });
        }

        if (!company.emailTemplates.find(template => template.type === MailTemplateType.RECEIPT)) {
            await this.prisma.mailTemplate.create({
                data: {
                    type: MailTemplateType.RECEIPT,
                    subject: 'Receipt #{{RECEIPT_NUMBER}} from {{COMPANY_NAME}}',
                    body: '<p>Dear {{CLIENT_NAME}},</p><p>Please find attached the receipt #{{RECEIPT_NUMBER}} from {{COMPANY_NAME}}.</p><p>Thank you for your business!</p><p>Best regards,<br>{{COMPANY_NAME}}</p><hr><p style="font-size: 12px; color: #666;">This email was sent from {{APP_URL}}</p>',
                    companyId: company.id
                }
            });
        }

        return await this.prisma.company.findFirst();
    }

    async getPDFTemplateConfig(): Promise<PDFConfig> {
        const existingCompany = await this.prisma.company.findFirst({
            include: { pdfConfig: true }
        });

        if (!existingCompany?.pdfConfig) {
            throw new BadRequestException('No PDF configuration found for the company');
        }

        return {
            fontFamily: existingCompany.pdfConfig.fontFamily,
            includeLogo: existingCompany.pdfConfig.includeLogo,
            logoB64: existingCompany.pdfConfig.logoB64,
            padding: existingCompany.pdfConfig.padding,
            primaryColor: existingCompany.pdfConfig.primaryColor,
            secondaryColor: existingCompany.pdfConfig.secondaryColor,

            labels: {
                billTo: existingCompany.pdfConfig.billTo,
                description: existingCompany.pdfConfig.description,
                date: existingCompany.pdfConfig.date,
                dueDate: existingCompany.pdfConfig.dueDate,
                grandTotal: existingCompany.pdfConfig.grandTotal,
                invoice: existingCompany.pdfConfig.invoice,
                quantity: existingCompany.pdfConfig.quantity,
                quote: existingCompany.pdfConfig.quote,
                quoteFor: existingCompany.pdfConfig.quoteFor,
                subtotal: existingCompany.pdfConfig.subtotal,
                total: existingCompany.pdfConfig.total,
                unitPrice: existingCompany.pdfConfig.unitPrice,
                validUntil: existingCompany.pdfConfig.validUntil,
                vat: existingCompany.pdfConfig.vat,
                vatRate: existingCompany.pdfConfig.vatRate,
                notes: existingCompany.pdfConfig.notes,
                paymentMethod: existingCompany.pdfConfig.paymentMethod,
                paymentDetails: existingCompany.pdfConfig.paymentDetails,

                legalId: existingCompany.pdfConfig.legalId,
                VATId: existingCompany.pdfConfig.VATId,
            }
        }
    }

    async editPDFTemplateConfig(pdfConfig: PDFConfig) {
        const existingCompany = await this.prisma.company.findFirst({
            include: { pdfConfig: true }
        });

        if (!existingCompany?.pdfConfig) {
            throw new BadRequestException('No PDF configuration found for the company');
        }

        return this.prisma.pDFConfig.update({
            where: { id: existingCompany.pdfConfig.id }, // ✅ ici on utilise un identifiant unique
            data: {
                fontFamily: pdfConfig.fontFamily,
                includeLogo: pdfConfig.includeLogo,
                logoB64: pdfConfig.logoB64,
                padding: pdfConfig.padding,
                primaryColor: pdfConfig.primaryColor,
                secondaryColor: pdfConfig.secondaryColor,

                billTo: pdfConfig.labels.billTo,
                description: pdfConfig.labels.description,
                dueDate: pdfConfig.labels.dueDate,
                date: pdfConfig.labels.date,
                grandTotal: pdfConfig.labels.grandTotal,
                invoice: pdfConfig.labels.invoice,
                quantity: pdfConfig.labels.quantity,
                quote: pdfConfig.labels.quote,
                quoteFor: pdfConfig.labels.quoteFor,
                subtotal: pdfConfig.labels.subtotal,
                total: pdfConfig.labels.total,
                unitPrice: pdfConfig.labels.unitPrice,
                validUntil: pdfConfig.labels.validUntil,
                vat: pdfConfig.labels.vat,
                vatRate: pdfConfig.labels.vatRate,

                notes: pdfConfig.labels.notes,
                paymentMethod: pdfConfig.labels.paymentMethod,
                paymentDetails: pdfConfig.labels.paymentDetails,

                legalId: pdfConfig.labels.legalId,
                VATId: pdfConfig.labels.VATId,
            }
        });
    }


    async editCompanyInfo(editCompanyDto: EditCompanyDto) {
        const data = { ...editCompanyDto };
        const existingCompany = await this.prisma.company.findFirst();

        if (existingCompany) {
            const { pdfConfig, ...rest } = data;

            return this.prisma.company.update({
                where: { id: existingCompany.id },
                data: {
                    ...rest
                }
            });
        } else {
            return this.prisma.company.create({
                data: {
                    ...data,
                    pdfConfig: {
                        create: {}
                    },
                    emailTemplates: {
                        createMany: {
                            data: [
                                {
                                    type: 'SIGNATURE_REQUEST',
                                    subject: 'Please sign document #{{SIGNATURE_NUMBER}}',
                                    body: '<h2>Document Signature Required</h2><p>Hello,</p><p>You have been requested to sign the following document:</p><div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">  <strong>Document:</strong> {{SIGNATURE_NUMBER}}<br>  <strong>Signature ID:</strong> {{SIGNATURE_ID}}</div><p>Please click the button below to review and sign the document:</p><div style="text-align: center; margin: 30px 0;">  <a href="{{SIGNATURE_URL}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Sign Document</a></div><p>If you have any questions, please don\'t hesitate to contact us.</p><p>Best regards,<br>The Invoicerr Team</p><hr><p style="font-size: 12px; color: #666;">This email was sent from {{APP_URL}}</p>'
                                },
                                {
                                    type: 'VERIFICATION_CODE',
                                    subject: 'Your verification code',
                                    body: '<p>Hello,</p><p>Here is your verification code:</p><div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">  <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 4px; font-family: monospace;">{{OTP_CODE}}</div></div><p>This code will expire in 10 minutes. Please enter it in the application to complete your verification.</p><p>If you didn\'t request this code, please ignore this email.</p><p>Best regards,<br>The Invoicerr Team</p>'
                                },
                                {
                                    type: 'INVOICE',
                                    subject: 'Invoice #{{INVOICE_NUMBER}} from {{COMPANY_NAME}}',
                                    body: '<p>Dear {{CLIENT_NAME}},</p><p>Please find attached the invoice #{{INVOICE_NUMBER}} from {{COMPANY_NAME}}.</p><p>Thank you for your business!</p><p>Best regards,<br>{{COMPANY_NAME}}</p><hr><p style="font-size: 12px; color: #666;">This email was sent from {{APP_URL}}</p>'
                                }
                            ]
                        }
                    }
                }
            });
        }
    }

    async getEmailTemplates(): Promise<EmailTemplate[]> {
        const existingCompany = await this.prisma.company.findFirst({
            include: { emailTemplates: true }
        });

        if (!existingCompany?.emailTemplates) {
            throw new BadRequestException('No email templates found for the company');
        }

        return existingCompany.emailTemplates.map(template => ({
            id: template.type,
            dbId: template.id,
            companyId: existingCompany.id,
            name: template.type
                .replace('_', ' ')
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' '),
            subject: template.subject,
            body: template.body,
            variables: {
                APP_URL: process.env.APP_URL || 'http://localhost:3000',
                ...template.type === MailTemplateType.SIGNATURE_REQUEST && {
                    SIGNATURE_ID: randomUUID(),
                    SIGNATURE_NUMBER: 'QUOTE-2025-0001',
                    SIGNATURE_URL: `${process.env.APP_URL || 'http://localhost:3000'}/signature/${randomUUID()}`
                },
                ...template.type === MailTemplateType.VERIFICATION_CODE && {
                    OTP_CODE: '1234-5678',
                },
                ...template.type === MailTemplateType.INVOICE && {
                    INVOICE_NUMBER: 'INV-2025-0001',
                    CLIENT_NAME: 'Acme',
                    COMPANY_NAME: existingCompany.name,
                },
                ...template.type === MailTemplateType.RECEIPT && {
                    RECEIPT_NUMBER: 'REC-2025-0001',
                    CLIENT_NAME: 'Acme',
                    COMPANY_NAME: existingCompany.name,
                }
            }
        }));
    }

    async updateEmailTemplate(id: MailTemplate['id'], subject: string, body: string) {
        let existingTemplate = await this.prisma.mailTemplate.findUnique({
            where: { id },
        });
        if (!existingTemplate) {
            throw new BadRequestException(`Email template with id ${id} not found`);
        }

        existingTemplate = await this.prisma.mailTemplate.update({
            where: { id },
            data: {
                subject,
                body
            }
        });

        return existingTemplate
    }
}
