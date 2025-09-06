import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { ClientsController } from '@/models/clients/clients.controller';
import { ClientsService } from '@/models/clients/clients.service';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, JwtService]
})
export class ClientsModule { }
