import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { QuotesController } from '@/models/quotes/quotes.controller';
import { QuotesService } from '@/models/quotes/quotes.service';

@Module({
  controllers: [QuotesController],
  providers: [QuotesService, JwtService]
})
export class QuotesModule { }
