import { DangerController } from './danger.controller';
import { DangerService } from './danger.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [DangerController],
  providers: [DangerService, PrismaService, MailService, JwtService]
})
export class DangerModule { }
