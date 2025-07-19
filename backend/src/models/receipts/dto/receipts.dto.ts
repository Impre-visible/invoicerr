export class CreateReceiptDto {
    invoiceId: string;
    items: {
        id: string;
        amount_paid: number;
    }[];
    paymentMethod: string;
    paymentDetails: string;
}

export class EditReceiptDto extends CreateReceiptDto {
    id: string;
}