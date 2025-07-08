export class UpsertInvoicesDto {
    quoteId: string;
    clientId: string;
    notes: string;
    paymentMethod: string;
    paymentDetails: string;
    recurrenceRule: {
        interval: number;
        units: string;
    };
    items: {
        id: string;
        description: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        order: number;
    }[];
}