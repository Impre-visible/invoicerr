import type { Invoice } from "./invoice";

export interface CreditNote {
    id: string;
    number: number;
    rawNumber?: string; // Raw number for custom formats (CN-XXXX)
    reason: string; // Reason for the credit note (e.g., "Refund", "Correction", "")
    invoiceId: string;
    invoice?: Invoice
    items: CreditNoteItem[];
    taxCredit: number; // Total tax credit amount (calculates as sum of (quantity * unitPrice * vatRate / 100) for all items)
    totalCredit: number; // Total credit amount (including tax) (calculates as sum of (quantity * unitPrice * (1 + vatRate / 100)) for all items)
    invoiceAmount: number; // Original invoice amount (calculates as sum of (quantity * unitPrice * (1 + vatRate / 100)) for all invoice items)
    adjustedInvoiceAmount: number; // Adjusted invoice amount after credit note (calculates as invoiceAmount - totalCredit)
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}

export interface CreditNoteItem {
    id: string;
    creditNoteId: string;
    description: string;
    quantity: number;
    unitPrice: number; // Unit price before tax
    vatRate: number; // VAT rate as a percentage (e.g., 20 for 20%)
}
