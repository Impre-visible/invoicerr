import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';

import { LoginRequired } from 'src/decorators/login-required.decorator';
import { CreditNotesService } from './credit-notes.service';
import { Response } from 'express';
import { CreateCreditNoteDto, EditCreditNoteDto } from './dto/credit-notes.dto';

@Controller('credit-notes')
export class CreditNotesController {
    constructor(private readonly creditNotesService: CreditNotesService) { }

    @Get()
    @LoginRequired()
    async getCreditNotesInfo(@Param('page') page: string) {
        return await this.creditNotesService.getCreditNotes(page);
    }
    @Get('search')
    @LoginRequired()
    async searchClients(@Query('query') query: string) {
        return await this.creditNotesService.searchCreditNotes(query);
    }

    @Post('create-from-invoice')
    @LoginRequired()
    async createCreditNoteFromInvoice(@Body('invoiceId') invoiceId: string) {
        if (!invoiceId) {
            throw new Error('Invoice ID is required');
        }
        return await this.creditNotesService.createCreditNoteFromInvoice(invoiceId);
    }

    @Get(':id/pdf')
    @LoginRequired()
    async getCreditNotePdf(@Param('id') id: string, @Res() res: Response) {
        if (id === 'undefined') return res.status(400).send('Invalid credit note ID');
        const pdfBuffer = await this.creditNotesService.getCreditNotePdf(id);
        if (!pdfBuffer) {
            res.status(404).send('Credit note not found or PDF generation failed');
            return;
        }
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="credit-note-${id}.pdf"`,
            'Content-Length': pdfBuffer.length.toString(),
        });
        res.send(pdfBuffer);
    }

    @Post('send')
    @LoginRequired()
    sendReceiptByEmail(@Body('id') id: string) {
        if (!id) {
            throw new Error('Credit note ID is required');
        }
        return this.creditNotesService.sendCreditNoteByEmail(id);
    }

    @Post()
    @LoginRequired()
    postCreditNotesInfo(@Body() body: CreateCreditNoteDto) {
        return this.creditNotesService.createCreditNote(body);
    }

    @Patch(':id')
    @LoginRequired()
    editCreditNotesInfo(@Param('id') id: string, @Body() body: EditCreditNoteDto) {
        return this.creditNotesService.editCreditNote({ ...body, id });
    }

    @Delete(':id')
    @LoginRequired()
    deleteCreditNote(@Param('id') id: string) {
        return this.creditNotesService.deleteCreditNote(id);
    }
}
