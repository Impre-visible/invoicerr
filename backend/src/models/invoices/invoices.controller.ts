import { Body, Controller, Delete, Get, Param, Patch, Post, Res } from '@nestjs/common';

import { CreateInvoiceDto, EditInvoicesDto } from './dto/invoices.dto';
import { LoginRequired } from 'src/decorators/login-required.decorator';
import { InvoicesService } from './invoices.service';
import { Response } from 'express';

@Controller('invoices')
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) { }

    @Get()
    @LoginRequired()
    async getInvoicesInfo(@Param('page') page: string) {
        return await this.invoicesService.getInvoices(page);
    }

    @Get(':id/pdf')
    @LoginRequired()
    async getInvoicePdf(@Param('id') id: string, @Res() res: Response) {
        if (id === 'undefined') return res.status(400).send('Invalid invoice ID');
        const pdfBuffer = await this.invoicesService.getInvoicePdf(id);
        if (!pdfBuffer) {
            res.status(404).send('Invoice not found or PDF generation failed');
            return;
        }
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
            'Content-Length': pdfBuffer.length.toString(),
        });
        res.send(pdfBuffer);
    }

    @Post('create-from-quote')
    @LoginRequired()
    createInvoiceFromQuote(@Body('quoteId') quoteId: string) {
        return this.invoicesService.createInvoiceFromQuote(quoteId);
    }

    @Post()
    @LoginRequired()
    postInvoicesInfo(@Body() body: CreateInvoiceDto) {
        return this.invoicesService.createInvoice(body);
    }

    @Patch(':id')
    @LoginRequired()
    editInvoicesInfo(@Param('id') id: string, @Body() body: EditInvoicesDto) {
        return this.invoicesService.editInvoice({ ...body, id });
    }

    @Delete(':id')
    @LoginRequired()
    deleteInvoice(@Param('id') id: string) {
        return this.invoicesService.deleteInvoice(id);
    }
}
