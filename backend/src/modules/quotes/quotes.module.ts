import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { QuotesController } from '@/modules/quotes/quotes.controller';
import { QuotesService } from '@/modules/quotes/quotes.service';

@Module({
  controllers: [QuotesController],
  providers: [QuotesService, JwtService]
})
export class QuotesModule { }
