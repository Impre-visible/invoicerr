import { EditClientsDto } from '@/modules/clients/dto/clients.dto';
import prisma from '@/prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class ClientsService {

    async getClients(page: string) {
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = 10;
        const skip = (pageNumber - 1) * pageSize;

        const clients = await prisma.client.findMany({
            skip,
            take: pageSize,
            orderBy: {
                name: 'asc',
            },
        });

        const totalClients = await prisma.client.count();

        return { pageCount: Math.ceil(totalClients / pageSize), clients };
    }

    async searchClients(query: string) {
        if (!query) {
            return prisma.client.findMany({
                where: { isActive: true },
                take: 10,
                orderBy: {
                    name: 'asc',
                },
            });
        }

        return prisma.client.findMany({
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

        // Server-side validation to mirror frontend rules:
        // - INDIVIDUAL: contactFirstname & contactLastname are required
        // - COMPANY: name & legalId (SIRET/SIREN) are required
        const type = (data as any).type || 'COMPANY';

        if (type === 'INDIVIDUAL') {
            if (!data.contactFirstname || (data.contactFirstname as string).trim() === '') {
                throw new BadRequestException('First name is required for individual clients');
            }
            if (!data.contactLastname || (data.contactLastname as string).trim() === '') {
                throw new BadRequestException('Last name is required for individual clients');
            }
        } else {
            if (!data.name || (data.name as string).trim() === '') {
                throw new BadRequestException('Company name is required for company clients');
            }
            if (!data.legalId || (data.legalId as string).trim() === '') {
                throw new BadRequestException('SIRET/SIREN (legalId) is required for company clients');
            }
        }

        return prisma.client.create({ data });
    }

    async editClientsInfo(editClientsDto: EditClientsDto) {
        if (!editClientsDto.id) {
            throw new BadRequestException('Client ID is required for editing');
        }

        const existingClient = await prisma.client.findUnique({ where: { id: editClientsDto.id } });
        if (!existingClient) {
            throw new BadRequestException('Client not found');
        }

        const data = { ...editClientsDto } as any;
        // Prefer explicit type in payload, otherwise fall back to existing client's type
        const type = data.type || existingClient.type || 'COMPANY';

        if (type === 'INDIVIDUAL') {
            if (!data.contactFirstname || (data.contactFirstname as string).trim() === '') {
                throw new BadRequestException('First name is required for individual clients');
            }
            if (!data.contactLastname || (data.contactLastname as string).trim() === '') {
                throw new BadRequestException('Last name is required for individual clients');
            }
        } else {
            if (!data.name || (data.name as string).trim() === '') {
                throw new BadRequestException('Company name is required for company clients');
            }
            if (!data.legalId || (data.legalId as string).trim() === '') {
                throw new BadRequestException('SIRET/SIREN (legalId) is required for company clients');
            }
        }

        return await prisma.client.update({
            where: { id: editClientsDto.id },
            data: { ...editClientsDto, isActive: true },
        })
    }

    deleteClient(id: string) {
        return prisma.client.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
