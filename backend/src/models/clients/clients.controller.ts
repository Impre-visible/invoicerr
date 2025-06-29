import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { ClientsService } from './clients.service';
import { LoginRequired } from 'src/decorators/login-required.decorator';
import { EditClientsDto } from './dto/clients.dto';

@Controller('clients')
export class ClientsController {

    constructor(private readonly clientsService: ClientsService) { }

    @Get()
    @LoginRequired()
    async getClientsInfo(@Param('page') page: string) {
        return await this.clientsService.getClients(page);
    }

    @Get('search')
    @LoginRequired()
    async searchClients(@Query('query') query: string) {
        return await this.clientsService.searchClients(query);
    }

    @Post()
    @LoginRequired()
    postClientsInfo(@Body() body: EditClientsDto) {
        return this.clientsService.createClient(body);
    }

    @Patch(':id')
    @LoginRequired()
    async editClientsInfo(@Param('id') id: string, @Body() body: EditClientsDto) {
        return this.clientsService.editClientsInfo({ ...body, id });
    }

    @Delete(':id')
    @LoginRequired()
    deleteClient(@Param('id') id: string) {
        return this.clientsService.deleteClient(id);
    }
}
