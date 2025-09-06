import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { MailService } from '@/mail/mail.service';
import { ReceiptsController } from '@/modules/receipts/receipts.controller';
import { ReceiptsService } from '@/modules/receipts/receipts.service';

@Module({
    controllers: [ReceiptsController],
    providers: [ReceiptsService, MailService, JwtService]
})
export class ReceiptsModule { }
