import { PrismaClient, QuoteStatus } from "@prisma/client";

export async function markQuoteAs(quoteId: string, status: QuoteStatus) {
    const prisma = new PrismaClient();

    await prisma.quote.update({
        where: { id: quoteId },
        data: {
            status: status
        }
    });

    prisma.$disconnect();
}