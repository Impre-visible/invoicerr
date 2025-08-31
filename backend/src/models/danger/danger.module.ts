import { DangerController } from './danger.controller';
import { DangerService } from './danger.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { Module } from '@nestjs/common';

@Module({
  controllers: [DangerController],
  providers: [DangerService, MailService, JwtService]
})
export class DangerModule { }
