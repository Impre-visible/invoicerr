export class CreateQuoteDto {
    // number is auto generated
    title?: string;
    clientId: string;
    validUntil?: Date;
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
    clientId?: string;
    validUntil?: Date;
    items?: {
        id?: string; // Optional for new items
        description: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        order: number;
    }[];
}