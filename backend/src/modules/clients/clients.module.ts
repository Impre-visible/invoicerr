import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { ClientsController } from '@/modules/clients/clients.controller';
import { ClientsService } from '@/modules/clients/clients.service';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, JwtService]
})
export class ClientsModule { }
