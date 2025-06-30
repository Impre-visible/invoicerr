import { EditCompanyDto, PDFConfig } from './dto/company.dto';

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CompanyService {
    constructor(private readonly prisma: PrismaService) { }

    async getCompanyInfo() {
        return await this.prisma.company.findFirst();
    }

    async getPDFTemplateConfig(): Promise<PDFConfig> {
        const existingCompany = await this.prisma.company.findFirst({
            include: { pdfConfig: true }
        });

        if (!existingCompany?.pdfConfig) {
            throw new Error('No PDF configuration found for the company');
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
                vatRate: existingCompany.pdfConfig.vatRate
            }
        }
    }

    async editPDFTemplateConfig(pdfConfig: PDFConfig) {
        const existingCompany = await this.prisma.company.findFirst({
            include: { pdfConfig: true }
        });

        if (!existingCompany?.pdfConfig) {
            throw new Error('No PDF configuration found for the company');
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
                    }
                }
            });
        }
    }
}
