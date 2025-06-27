import { EditClientsDto } from './dto/clients.dto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ClientsService {
    constructor(private readonly prisma: PrismaService) { }

    async getClients(page: string) {
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = 10;
        const skip = (pageNumber - 1) * pageSize;

        const clients = await this.prisma.client.findMany({
            skip,
            take: pageSize,
            orderBy: {
                name: 'asc',
            },
        });

        const totalClients = await this.prisma.client.count();

        return { pageCount: Math.ceil(totalClients / pageSize), clients };
    }

    async createClient(editClientsDto: EditClientsDto) {
        const { id, ...data } = editClientsDto;
        return this.prisma.client.create({ data });
    }

    async editClientsInfo(editClientsDto: EditClientsDto) {
        if (!editClientsDto.id) {
            throw new Error('Client ID is required for editing');
        }
        if (! await this.prisma.client.findUnique({ where: { id: editClientsDto.id } })) {
            throw new Error('Client not found');
        }

        this.prisma.client.update({
            where: { id: editClientsDto.id },
            data: editClientsDto,
        })
    }

    deleteClient(id: string) {
        return this.prisma.client.delete({
            where: { id },
        });
    }
}
