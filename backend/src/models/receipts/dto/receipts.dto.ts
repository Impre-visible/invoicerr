export class CreateReceiptDto {
    invoiceId: string;
    items: {
        id: string;
        amountPaid: number | string;
    }[];
    paymentMethod: string;
    paymentDetails: string;
}

export class EditReceiptDto extends CreateReceiptDto {
    id: string;
}