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

    async searchClients(query: string) {
        console.debug(`Searching clients with query: ${query}`);
        if (!query) {
            return this.prisma.client.findMany({
                take: 10,
                orderBy: {
                    name: 'asc',
                },
            });
        }

        return this.prisma.client.findMany({
            where: {
                isActive: true,
                OR: [
                    { name: { contains: query } },
                    { contactFirstname: { contains: query } },
                    { contactLastname: { contains: query } },
                    { contactEmail: { contains: query } },
                    { contactPhone: { contains: query } },
                    { address: { contains: query } },
                    { postalCode: { contains: query } },
                    { city: { contains: query } },
                    { country: { contains: query } },
                ],
            },
            take: 10,
            orderBy: {
                name: 'asc',
            },
        });
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
        return this.prisma.client.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
