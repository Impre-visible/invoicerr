import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  controllers: [QuotesController],
  providers: [QuotesService, JwtService]
})
export class QuotesModule { }
