import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { Module } from '@nestjs/common';
import { SignaturesController } from './signatures.controller';
import { SignaturesService } from './signatures.service';

@Module({
  controllers: [SignaturesController],
  providers: [SignaturesService, MailService, JwtService]
})
export class SignaturesModule { }
