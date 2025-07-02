import { Currency } from "@prisma/client";

export class CreateInvoiceDto {
    clientId: string;
    quoteId?: string;
    dueDate?: Date;
    currency?: Currency;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        order: number;
    }[];
}

export class EditInvoicesDto {
    id: string;
    clientId: string;
    dueDate?: Date;
    currency?: Currency;
    items: {
        id?: string; // Optional for new items
        description: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        order: number;
    }[];
}