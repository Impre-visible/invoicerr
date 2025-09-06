import { ClientsService } from '@/modules/clients/clients.service';
import { EditClientsDto } from '@/modules/clients/dto/clients.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async getClientsInfo(@Param('page') page: string) {
    return await this.clientsService.getClients(page);
  }

  @Get('search')
  async searchClients(@Query('query') query: string) {
    return await this.clientsService.searchClients(query);
  }

  @Post()
  postClientsInfo(@Body() body: EditClientsDto) {
    return this.clientsService.createClient(body);
  }

  @Patch(':id')
  async editClientsInfo(@Param('id') id: string, @Body() body: EditClientsDto) {
    return this.clientsService.editClientsInfo({ ...body, id });
  }

  @Delete(':id')
  deleteClient(@Param('id') id: string) {
    return this.clientsService.deleteClient(id);
  }
}
