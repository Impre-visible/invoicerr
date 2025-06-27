import { Body, Controller, Get, Post } from '@nestjs/common';

import { ClientsService } from './clients.service';
import { LoginRequired } from 'src/decorators/login-required.decorator';
import { EditClientsDto } from './dto/clients.dto';

@Controller('clients')
export class ClientsController {

    constructor(private readonly clientsService: ClientsService) { }

    @Get()
    @LoginRequired()
    getClientsInfo() {
        return this.clientsService.getClients();
    }

    @Post()
    @LoginRequired()
    postClientsInfo(@Body() body: EditClientsDto) {
        return this.clientsService.editClientsInfo(body);
    }
}
