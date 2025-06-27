import { Body, Controller, Get, Post } from '@nestjs/common';

import { CompanyService } from './company.service';
import { LoginRequired } from 'src/decorators/login-required.decorator';
import { EditCompanyDto } from './dto/company.dto';

@Controller('company')
export class CompanyController {

    constructor(private readonly companyService: CompanyService) { }

    @Get('info')
    @LoginRequired()
    getCompanyInfo() {
        return this.companyService.getCompanyInfo();
    }

    @Post('info')
    @LoginRequired()
    postCompanyInfo(@Body() body: EditCompanyDto) {
        return this.companyService.editCompanyInfo(body);
    }
}
