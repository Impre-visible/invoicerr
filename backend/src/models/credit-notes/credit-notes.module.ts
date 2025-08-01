import { CreditNotesController } from './credit-notes.controller';
import { CreditNotesService } from './credit-notes.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
    controllers: [CreditNotesController],
    providers: [CreditNotesService, PrismaService, MailService, JwtService]
})
export class CreditNotesModule { }
