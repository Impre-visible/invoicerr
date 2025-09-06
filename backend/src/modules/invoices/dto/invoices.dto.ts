import { Currency } from "@invoicerr/prisma/enums";

export class CreateInvoiceDto {
    clientId: string;
    quoteId?: string;
    recurringInvoiceId?: string; // Ajout du champ pour la relation
    dueDate?: Date;
    currency?: Currency;
    notes: string;
    paymentMethod?: string;
    paymentDetails?: string;
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
    quoteId?: string;
    recurringInvoiceId?: string;
    clientId: string;
    dueDate?: Date;
    currency?: Currency;
    notes: string;
    paymentMethod?: string;
    paymentDetails?: string;
    items: {
        id?: string; // Optional for new items
        description: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        order: number;
    }[];
}