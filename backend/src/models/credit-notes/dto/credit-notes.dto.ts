export class CreateCreditNoteDto {
    invoiceId: string;
    reason?: string;
    items: {
        invoiceItemId: string;
        quantity: number;
    }[];
}

export class EditCreditNoteDto extends CreateCreditNoteDto {
    id: string;
}