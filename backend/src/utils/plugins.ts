import { PrismaClient } from '@prisma/client';

export interface SigningPluginConfig {
    baseUrl: string;
    apiKey: string;
}

export async function getProviderConfig<T>(name: string) {
    const prisma = new PrismaClient();

    const plugin = await prisma.plugin.findFirst({
        where: {
            isActive: true,
            id: name,
        }
    })

    prisma.$disconnect();

    return (plugin?.config as T);
}
