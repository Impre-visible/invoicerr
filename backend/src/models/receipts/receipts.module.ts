import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './receipts.service';

@Module({
    controllers: [ReceiptsController],
    providers: [ReceiptsService, PrismaService, JwtService]
})
export class ReceiptsModule { }
