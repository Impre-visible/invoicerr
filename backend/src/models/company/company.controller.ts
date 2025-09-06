import { Body, Controller, Get, Post, Put } from '@nestjs/common';

import { CompanyService } from './company.service';
import { EditCompanyDto, PDFConfig } from './dto/company.dto';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('info')
  async getCompanyInfo() {
    const data = await this.companyService.getCompanyInfo();
    return data || {};
  }

  @Post('info')
  async postCompanyInfo(@Body() body: EditCompanyDto) {
    const data = await this.companyService.editCompanyInfo(body);
    return data || {};
  }

  @Get('pdf-template')
  async getPDFTemplateConfig() {
    const data = await this.companyService.getPDFTemplateConfig();
    return data || {};
  }

  @Post('pdf-template')
  async postPDFTemplateConfig(@Body() body: PDFConfig) {
    const data = await this.companyService.editPDFTemplateConfig(body);
    return data || {};
  }

  @Get('email-templates')
  async getEmailTemplates() {
    const data = await this.companyService.getEmailTemplates();
    return data || {};
  }

  @Put('email-templates')
  async updateEmailTemplate(
    @Body() body: { dbId: string; subject: string; body: string },
  ) {
    const data = await this.companyService.updateEmailTemplate(
      body.dbId,
      body.subject,
      body.body,
    );
    return data || {};
  }
}
