import { Body, Controller, Delete, Get, Param, Patch, Post, Res } from '@nestjs/common';

import { CreateQuoteDto, EditQuotesDto } from './dto/quotes.dto';
import { LoginRequired } from 'src/decorators/login-required.decorator';
import { QuotesService } from './quotes.service';
import { Response } from 'express';

@Controller('quotes')
export class QuotesController {
    constructor(private readonly quotesService: QuotesService) { }

    @Get()
    @LoginRequired()
    async getQuotesInfo(@Param('page') page: string) {
        return await this.quotesService.getQuotes(page);
    }

    @Get(':id/pdf')
    @LoginRequired()
    async getQuotePdf(@Param('id') id: string, @Res() res: Response) {
        if (id === 'undefined') return res.status(400).send('Invalid quote ID');
        const pdfBuffer = await this.quotesService.getQuotePdf(id);
        if (!pdfBuffer) {
            res.status(404).send('Quote not found or PDF generation failed');
            return;
        }
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="quote-${id}.pdf"`,
            'Content-Length': pdfBuffer.length.toString(),
        });
        res.send(pdfBuffer);
    }

    @Post('/mark-as-signed')
    @LoginRequired()
    async markQuoteAsSigned(@Body('id') id: string) {
        if (!id) {
            throw new Error('Quote ID is required');
        }
        return await this.quotesService.markQuoteAsSigned(id);
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
