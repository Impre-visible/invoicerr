export class CreateInvoiceDto {
    // number is auto generated
    title?: string;
    clientId: string;
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
    title?: string;
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