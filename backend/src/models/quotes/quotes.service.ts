import { EditQuotesDto } from './dto/quotes.dto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class QuotesService {
    constructor(private readonly prisma: PrismaService) { }

}
