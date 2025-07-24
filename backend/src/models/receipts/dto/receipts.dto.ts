export class CreateReceiptDto {
    invoiceId: string;
    items: {
        invoiceItemId: string;
        amountPaid: number | string;
    }[];
    paymentMethod: string;
    paymentDetails: string;
}

export class EditReceiptDto extends CreateReceiptDto {
    id: string;
}