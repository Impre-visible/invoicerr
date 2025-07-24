import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';

import { CreateReceiptDto, EditReceiptDto } from './dto/receipts.dto';
import { LoginRequired } from 'src/decorators/login-required.decorator';
import { ReceiptsService } from './receipts.service';
import { Response } from 'express';

@Controller('receipts')
export class ReceiptsController {
    constructor(private readonly receiptsService: ReceiptsService) { }

    @Get()
    @LoginRequired()
    async getReceiptsInfo(@Param('page') page: string) {
        return await this.receiptsService.getReceipts(page);
    }
    @Get('search')
    @LoginRequired()
    async searchClients(@Query('query') query: string) {
        return await this.receiptsService.searchReceipts(query);
    }

    @Post('create-from-invoice')
    @LoginRequired()
    async createReceiptFromInvoice(@Body('id') invoiceId: string) {
        if (!invoiceId) {
            throw new Error('Invoice ID is required');
        }
        return await this.receiptsService.createReceiptFromInvoice(invoiceId);
    }

    @Get(':id/pdf')
    @LoginRequired()
    async getReceiptPdf(@Param('id') id: string, @Res() res: Response) {
        if (id === 'undefined') return res.status(400).send('Invalid receipt ID');
        const pdfBuffer = await this.receiptsService.getReceiptPdf(id);
        if (!pdfBuffer) {
            res.status(404).send('Receipt not found or PDF generation failed');
            return;
        }
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="receipt-${id}.pdf"`,
            'Content-Length': pdfBuffer.length.toString(),
        });
        res.send(pdfBuffer);
    }

    @Post('send')
    @LoginRequired()
    sendReceiptByEmail(@Body('id') id: string) {
        if (!id) {
            throw new Error('Receipt ID is required');
        }
        return this.receiptsService.sendReceiptByEmail(id);
    }

    @Post()
    @LoginRequired()
    postReceiptsInfo(@Body() body: CreateReceiptDto) {
        return this.receiptsService.createReceipt(body);
    }

    @Patch(':id')
    @LoginRequired()
    editReceiptsInfo(@Param('id') id: string, @Body() body: EditReceiptDto) {
        return this.receiptsService.editReceipt({ ...body, id });
    }

    @Delete(':id')
    @LoginRequired()
    deleteReceipt(@Param('id') id: string) {
        return this.receiptsService.deleteReceipt(id);
    }
}
