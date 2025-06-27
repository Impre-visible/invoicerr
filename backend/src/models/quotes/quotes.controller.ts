import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { EditQuotesDto } from './dto/quotes.dto';
import { LoginRequired } from 'src/decorators/login-required.decorator';
import { QuotesService } from './quotes.service';

@Controller('quotes')
export class QuotesController {
    constructor(private readonly quotesService: QuotesService) { }
}
