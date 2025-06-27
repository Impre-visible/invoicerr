import { EditClientsDto } from './dto/clients.dto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ClientsService {
    constructor(private readonly prisma: PrismaService) { }

    getClients() {
        return this.prisma.client.findMany();
    }

    async editClientsInfo(editClientsDto: EditClientsDto) {
        const data = { ...editClientsDto };
        const existingClients = await this.prisma.client.findFirst();

        return existingClients
            ? this.prisma.client.update({
                where: { id: existingClients.id },
                data,
            })
            : this.prisma.client.create({ data });
    }
}
