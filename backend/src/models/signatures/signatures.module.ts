import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignaturesController } from './signatures.controller';
import { SignaturesService } from './signatures.service';

@Module({
  controllers: [SignaturesController],
  providers: [SignaturesService, PrismaService, JwtService]
})
export class SignaturesModule { }
