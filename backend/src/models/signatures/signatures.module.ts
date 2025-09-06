import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { MailService } from '@/mail/mail.service';
import { SignaturesController } from '@/models/signatures/signatures.controller';
import { SignaturesService } from '@/models/signatures/signatures.service';

@Module({
  controllers: [SignaturesController],
  providers: [SignaturesService, MailService, JwtService]
})
export class SignaturesModule { }
