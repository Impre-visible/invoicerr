import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';

import { Response } from 'express';
import { ExportFormat } from '@fin.cx/einvoice';
import { CreateInvoiceDto, EditInvoicesDto } from '@/modules/invoices/dto/invoices.dto';
import { InvoicesService } from '@/modules/invoices/invoices.service';
import { PluginsService } from '@/modules/plugins/plugins.service';

@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly pluginService: PluginsService,
  ) {}

  @Get()
  async getInvoicesInfo(@Param('page') page: string) {
    return await this.invoicesService.getInvoices(page);
  }

  @Get('search')
  async searchInvoices(@Param('query') query: string) {
    return await this.invoicesService.searchInvoices(query);
  }

  @Get(':id/pdf')
  async getInvoicePdf(
    @Param('id') id: string,
    @Query('format') format: ExportFormat | undefined,
    @Res() res: Response,
  ) {
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

  @Get(':id/download/xml')
  async downloadInvoiceXml(
    @Param('id') id: string,
    @Query('format') format: string | ExportFormat,
    @Res() res: Response,
  ) {
    if (id === 'undefined') return res.status(400).send('Invalid invoice ID');
    let fileBuffer: Uint8Array | null = null;

    const xmlInvoice = await this.invoicesService.getInvoiceXMLFormat(id);
    let xmlString = '';
    if (this.pluginService.canGenerateXml(format)) {
      xmlString = await this.pluginService.generateXml(format, xmlInvoice);
    } else {
      xmlString = await xmlInvoice.exportXml(format as ExportFormat);
    }
    fileBuffer = Buffer.from(xmlString, 'utf-8');

    if (!fileBuffer) {
      res.status(404).send('Invoice not found or file generation failed');
      return;
    }
    res.set({
      'Content-Type': `application/xml`,
      'Content-Disposition': `attachment; filename="invoice-${id}-${format}.xml"`,
      'Content-Length': fileBuffer.length.toString(),
    });
    res.send(fileBuffer);
  }

  @Get(':id/download/pdf')
  async downloadInvoicePdf(
    @Param('id') id: string,
    @Query('format') format: ExportFormat | undefined,
    @Res() res: Response,
  ) {
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
      'Content-Disposition': `attachment; filename="invoice-${id}-${format || 'default'}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });
    res.send(pdfBuffer);
  }

  @Post('create-from-quote')
  createInvoiceFromQuote(@Body('quoteId') quoteId: string) {
    return this.invoicesService.createInvoiceFromQuote(quoteId);
  }

  @Post('mark-as-paid')
  markInvoiceAsPaid(@Body('invoiceId') invoiceId: string) {
    return this.invoicesService.markInvoiceAsPaid(invoiceId);
  }

  @Post()
  postInvoicesInfo(@Body() body: CreateInvoiceDto) {
    return this.invoicesService.createInvoice(body);
  }

  @Post('send')
  sendInvoiceByEmail(@Body('id') id: string) {
    return this.invoicesService.sendInvoiceByEmail(id);
  }

  @Patch(':id')
  editInvoicesInfo(@Param('id') id: string, @Body() body: EditInvoicesDto) {
    return this.invoicesService.editInvoice({ ...body, id });
  }

  @Delete(':id')
  deleteInvoice(@Param('id') id: string) {
    return this.invoicesService.deleteInvoice(id);
  }
}
