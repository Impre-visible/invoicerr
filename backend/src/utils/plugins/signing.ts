import { PrismaClient } from "@prisma/client";

export async function markInvoiceAsPaid(invoiceId: string) {
    const prisma = new PrismaClient();

    await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
            status: 'PAID',
            paidAt: new Date(),
        }
    });

    prisma.$disconnect();
}