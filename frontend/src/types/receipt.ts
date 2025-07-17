import type { Invoice } from "./invoice";

interface ReceiptItem {
    id: string;
    invoiceId: string;
    invoice?: Invoice;
    amountPaid: number;
    receiptId: string;
    receipt?: Receipt;
}

export interface Receipt {
    id: string;
    number: string;
    invoiceId: string;
    invoice?: Invoice;
    items: ReceiptItem[];
    totalPaid: number;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    title?: string; // Titre du reçu
    status?: string; // Statut du reçu (DRAFT, SENT, etc.)
    client?: {
        name: string; // Nom du client
    };
    validUntil?: string; // Date de validité
    totalHT?: number; // Total hors taxes
    totalTTC?: number; // Total toutes taxes comprises
    currency?: string; // Devise utilisée
}
