import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateQuoteDto, EditQuotesDto } from './dto/quotes.dto';
import { LoginRequired } from 'src/decorators/login-required.decorator';
import { QuotesService } from './quotes.service';

@Controller('quotes')
export class QuotesController {
    constructor(private readonly quotesService: QuotesService) { }

    @Get()
    @LoginRequired()
    async getQuotesInfo(@Param('page') page: string) {
        return await this.quotesService.getQuotes(page);
    }

    @Post()
    @LoginRequired()
    postQuotesInfo(@Body() body: CreateQuoteDto) {
        return this.quotesService.createQuote(body);
    }

    @Patch(':id')
    @LoginRequired()
    editQuotesInfo(@Param('id') id: string, @Body() body: EditQuotesDto) {
        return this.quotesService.editQuote({ ...body, id });
    }

    @Delete(':id')
    @LoginRequired()
    deleteQuote(@Param('id') id: string) {
        return this.quotesService.deleteQuote(id);
    }
}
