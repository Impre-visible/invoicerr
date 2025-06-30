import { Body, Controller, Get, Post } from '@nestjs/common';

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
}
