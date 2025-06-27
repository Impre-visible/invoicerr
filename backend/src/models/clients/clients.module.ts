import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, PrismaService, JwtService]
})
export class ClientsModule { }
