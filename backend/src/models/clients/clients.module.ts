import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, JwtService]
})
export class ClientsModule { }
