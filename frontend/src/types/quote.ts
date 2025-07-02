import type { Client } from "./client";
import type { Company } from "./company";

export enum QuoteStatus {
    DRAFT = "DRAFT",
    SENT = "SENT",
    VIEWED = "VIEWED",
    SIGNED = "SIGNED",
    EXPIRED = "EXPIRED",
}

export interface Quote {
    id: string;
    number: string; // Ex: "Q-2025-0001"
    title?: string;
    clientId: string;
    client: Client;
    companyId: string;
    company: Company;
    items: QuoteItem[];
    status: QuoteStatus;
    createdAt: Date;
    updatedAt: Date;
    validUntil?: Date;
    signedAt?: Date;
    viewedAt?: Date;
    signedBy?: string;
    signatureSvg?: string;
    totalHT: number;
    totalVAT: number;
    totalTTC: number;
    currency: string; // Currency code, e.g., "EUR", "USD"
    isActive: boolean;
}

export interface QuoteItem {
    id: string;
    quoteId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number; // 20 for 20%
    order: number; // For sorting items in the quote PDF
}