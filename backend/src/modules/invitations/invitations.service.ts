import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationsService {
    constructor(private readonly prisma: PrismaService) { }

    private generateCode(): string {
        return randomBytes(16).toString('hex').toUpperCase();
    }

    async canRegister(invitationCode?: string): Promise<{ allowed: boolean; requiresCode: boolean; message?: string }> {
        const userCount = await this.prisma.user.count();

        if (userCount === 0) {
            return { allowed: true, requiresCode: false };
        }

        if (!invitationCode) {
            return {
                allowed: false,
                requiresCode: true,
                message: 'An invitation code is required to register',
            };
        }

        const invitation = await this.prisma.invitationCode.findUnique({
            where: { code: invitationCode },
        });

        if (!invitation) {
            return {
                allowed: false,
                requiresCode: true,
                message: 'Invalid invitation code',
            };
        }

        if (invitation.usedAt) {
            return {
                allowed: false,
                requiresCode: true,
                message: 'This invitation code has already been used',
            };
        }

        if (invitation.expiresAt && invitation.expiresAt < new Date()) {
            return {
                allowed: false,
                requiresCode: true,
                message: 'This invitation code has expired',
            };
        }

        return { allowed: true, requiresCode: true };
    }

    async isFirstUser(): Promise<boolean> {
        const userCount = await this.prisma.user.count();
        return userCount === 0;
    }

    async createInvitation(createdById: string, expiresInDays?: number) {
        const code = this.generateCode();

        const invitation = await this.prisma.invitationCode.create({
            data: {
                code,
                createdById,
                expiresAt: expiresInDays
                    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
                    : null,
            },
        });

        return {
            id: invitation.id,
            code: invitation.code,
            createdAt: invitation.createdAt,
            expiresAt: invitation.expiresAt,
        };
    }

    async useInvitation(code: string, userId: string) {
        const invitation = await this.prisma.invitationCode.findUnique({
            where: { code },
        });

        if (!invitation) {
            throw new NotFoundException('Invitation code not found');
        }

        if (invitation.usedAt) {
            throw new BadRequestException('This invitation code has already been used');
        }

        if (invitation.expiresAt && invitation.expiresAt < new Date()) {
            throw new BadRequestException('This invitation code has expired');
        }

        return this.prisma.invitationCode.update({
            where: { id: invitation.id },
            data: {
                usedAt: new Date(),
                usedById: userId,
            },
        });
    }

    async listInvitations(userId: string) {
        return this.prisma.invitationCode.findMany({
            where: { createdById: userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                code: true,
                createdAt: true,
                expiresAt: true,
                usedAt: true,
                usedBy: {
                    select: {
                        id: true,
                        email: true,
                        firstname: true,
                        lastname: true,
                    },
                },
            },
        });
    }

    async deleteInvitation(id: string, userId: string) {
        const invitation = await this.prisma.invitationCode.findFirst({
            where: {
                id,
                createdById: userId,
                usedAt: null,
            },
        });

        if (!invitation) {
            throw new NotFoundException('Invitation not found or already used');
        }

        await this.prisma.invitationCode.delete({
            where: { id },
        });

        return { success: true };
    }
}
