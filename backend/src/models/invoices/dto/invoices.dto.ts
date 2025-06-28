export class CreateInvoiceDto {
    clientId: string;
    quoteId?: string;
    dueDate?: Date;
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
    items: {
        id?: string; // Optional for new items
        description: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        order: number;
    }[];
}