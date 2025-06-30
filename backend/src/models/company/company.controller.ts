import { Body, Controller, Get, Post, Put } from '@nestjs/common';

import { CompanyService } from './company.service';
import { LoginRequired } from 'src/decorators/login-required.decorator';
import { EditCompanyDto, PDFConfig } from './dto/company.dto';

@Controller('company')
export class CompanyController {

    constructor(private readonly companyService: CompanyService) { }

    @Get('info')
    @LoginRequired()
    async getCompanyInfo() {
        let data = await this.companyService.getCompanyInfo();
        return data || {};
    }

    @Post('info')
    @LoginRequired()
    async postCompanyInfo(@Body() body: EditCompanyDto) {
        let data = await this.companyService.editCompanyInfo(body);
        return data || {};
    }

    @Get('pdf-template')
    @LoginRequired()
    async getPDFTemplateConfig() {
        let data = await this.companyService.getPDFTemplateConfig();
        return data || {};
    }

    @Post('pdf-template')
    @LoginRequired()
    async postPDFTemplateConfig(@Body() body: PDFConfig) {
        let data = await this.companyService.editPDFTemplateConfig(body);
        return data || {};
    }

    @Get('email-templates')
    @LoginRequired()
    async getEmailTemplates() {
        let data = await this.companyService.getEmailTemplates();
        return data || {};
    }

    @Put('email-templates')
    @LoginRequired()
    async updateEmailTemplate(@Body() body: { dbId: string, subject: string, body: string }) {
        let data = await this.companyService.updateEmailTemplate(body.dbId, body.subject, body.body);
        return data || {};
    }
}
