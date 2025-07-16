export class CreateReceiptDto {
    invoiceId: string;
    items: {
        id: string;
        amount_paid: number;
    }[];
}

export class EditReceiptDto extends CreateReceiptDto {
    id: string;
}