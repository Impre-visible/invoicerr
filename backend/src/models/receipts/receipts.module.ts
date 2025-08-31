import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { Module } from '@nestjs/common';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './receipts.service';

@Module({
    controllers: [ReceiptsController],
    providers: [ReceiptsService, MailService, JwtService]
})
export class ReceiptsModule { }
