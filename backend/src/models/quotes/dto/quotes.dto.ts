import { Currency } from "@prisma/client";

export class CreateQuoteDto {
    // number is auto generated
    title?: string;
    clientId: string;
    validUntil?: Date;
    currency?: Currency;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        order: number;
    }[];
}

export class EditQuotesDto {
    id: string;
    title?: string;
    clientId: string;
    validUntil?: Date;
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