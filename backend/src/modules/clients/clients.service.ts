import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { EditClientsDto } from '@/modules/clients/dto/clients.dto';
import { WebhookDispatcherService } from '../webhooks/webhook-dispatcher.service';
import { WebhookEvent } from '../../../prisma/generated/prisma/client';
import prisma from '@/prisma/prisma.service';

@Injectable()
export class ClientsService {
    private readonly logger: Logger;

    constructor(private readonly webhookDispatcher: WebhookDispatcherService) {
        this.logger = new Logger(ClientsService.name);
    }

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

        const results = await prisma.client.findMany({
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

        try {
            await this.webhookDispatcher.dispatch(WebhookEvent.CLIENT_SEARCHED, {
                query,
                results: results.length,
            });
        } catch (error) {
            this.logger.error('Failed to dispatch CLIENT_SEARCHED webhook', error);
        }

        return results;
    }

    async createClient(editClientsDto: EditClientsDto) {
        const { id, ...data } = editClientsDto;

        const type = (data as any).type || 'COMPANY';

        if (type === 'INDIVIDUAL') {
            data.name = ``;
            if (!data.contactFirstname || (data.contactFirstname as string).trim() === '') {
                throw new BadRequestException('First name is required for individual clients');
            }
            if (!data.contactLastname || (data.contactLastname as string).trim() === '') {
                throw new BadRequestException('Last name is required for individual clients');
            }
        } else {
            data.contactFirstname = undefined;
            data.contactLastname = undefined;
            if (!data.name || (data.name as string).trim() === '') {
                throw new BadRequestException('Company name is required for company clients');
            }
            if (!data.legalId || (data.legalId as string).trim() === '') {
                throw new BadRequestException('SIRET/SIREN (legalId) is required for company clients');
            }
        }

        const newClient = await prisma.client.create({ data });

        try {
            await this.webhookDispatcher.dispatch(WebhookEvent.CLIENT_CREATED, {
                client: newClient,
            });
        } catch (error) {
            this.logger.error('Failed to dispatch CLIENT_CREATED webhook', error);
        }

        return newClient;
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

        const updatedClient = await prisma.client.update({
            where: { id: editClientsDto.id },
            data: { ...editClientsDto, isActive: true },
        });

        try {
            await this.webhookDispatcher.dispatch(WebhookEvent.CLIENT_UPDATED, {
                client: updatedClient,
            });
        } catch (error) {
            this.logger.error('Failed to dispatch CLIENT_UPDATED webhook', error);
        }

        return updatedClient;
    }

    async deleteClient(id: string) {
        const existingClient = await prisma.client.findUnique({ where: { id } });

        if (!existingClient) {
            throw new BadRequestException('Client not found');
        }

        const deletedClient = await prisma.client.update({
            where: { id },
            data: { isActive: false },
        });

        try {
            await this.webhookDispatcher.dispatch(WebhookEvent.CLIENT_DELETED, {
                client: existingClient,
            });
        } catch (error) {
            this.logger.error('Failed to dispatch CLIENT_DELETED webhook', error);
        }

        return deletedClient;
    }
}
