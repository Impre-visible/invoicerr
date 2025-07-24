import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';

import { CreateInvoiceDto, EditInvoicesDto } from './dto/invoices.dto';
import { LoginRequired } from 'src/decorators/login-required.decorator';
import { InvoicesService } from './invoices.service';
import { Response } from 'express';
import { ExportFormat } from '@fin.cx/einvoice';

@Controller('invoices')
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) { }

    @Get()
    @LoginRequired()
    async getInvoicesInfo(@Param('page') page: string) {
        return await this.invoicesService.getInvoices(page);
    }

    @Get('search')
    @LoginRequired()
    async searchInvoices(@Param('query') query: string) {
        return await this.invoicesService.searchInvoices(query);
    }

    @Get(':id/pdf')
    @LoginRequired()
    async getInvoicePdf(@Param('id') id: string, @Query('format') format: ExportFormat | undefined, @Res() res: Response) {
        if (id === 'undefined') return res.status(400).send('Invalid invoice ID');
        let pdfBuffer: Uint8Array | null = null;
        if (format) {
            pdfBuffer = await this.invoicesService.getInvoicePDFFormat(id, format);
        } else {
            pdfBuffer = await this.invoicesService.getInvoicePdf(id);
        }
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

    @Get(':id/download')
    @LoginRequired()
    async downloadInvoice(@Param('id') id: string, @Query('format') format: string | undefined, @Res() res: Response) {
        if (id === 'undefined') return res.status(400).send('Invalid invoice ID');
        let fileBuffer: Uint8Array | null = null;
        let fileFormat = "pdf"
        if (format === "") {
            fileBuffer = await this.invoicesService.getInvoicePdf(id);
        } else if (format) {
            fileFormat = format.split('-')[0]
        }

        if (fileFormat === "pdf") {
            fileBuffer = await this.invoicesService.getInvoicePDFFormat(id, format?.split('-')[1] as ExportFormat);
        } else if (fileFormat === "xml") {
            console.log("XML format requested");
            const xmlInvoice = await this.invoicesService.getInvoiceXMLFormat(id);
            const xmlString = await xmlInvoice.exportXml(format?.split('-')[1] as ExportFormat);
            fileBuffer = Buffer.from(xmlString, 'utf-8');
        }

        if (!fileBuffer) {
            res.status(404).send('Invoice not found or file generation failed');
            return;
        }
        res.set({
            'Content-Type': `application/${fileFormat}`,
            'Content-Disposition': `attachment; filename="invoice-${id}.${fileFormat}"`,
            'Content-Length': fileBuffer.length.toString(),
        });
        res.send(fileBuffer);
    }

    @Post('create-from-quote')
    @LoginRequired()
    createInvoiceFromQuote(@Body('quoteId') quoteId: string) {
        return this.invoicesService.createInvoiceFromQuote(quoteId);
    }

    @Post('mark-as-paid')
    @LoginRequired()
    markInvoiceAsPaid(@Body('invoiceId') invoiceId: string) {
        return this.invoicesService.markInvoiceAsPaid(invoiceId);
    }

    @Post()
    @LoginRequired()
    postInvoicesInfo(@Body() body: CreateInvoiceDto) {
        return this.invoicesService.createInvoice(body);
    }

    @Post('send')
    @LoginRequired()
    sendInvoiceByEmail(@Body('id') id: string) {
        return this.invoicesService.sendInvoiceByEmail(id);
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
