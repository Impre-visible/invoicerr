import type { Client } from "./client";
import type { Company } from "./company";

export enum InvoiceStatus {
    PAID = 'PAID',
    UNPAID = 'UNPAID',
    OVERDUE = 'OVERDUE',
    SENT = 'SENT'
}

export interface InvoiceItem {
    id: string;
    invoiceId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number; // 20 for 20%
    order: number;
}

export interface Invoice {
    id: string;
    number: string; // Ex: "INV-2025-0001"
    title?: string; // Optional title from DTOs
    quoteId?: string;
    clientId: string;
    companyId: string;
    client: Client
    company: Company
    items: InvoiceItem[];
    status: InvoiceStatus;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    dueDate: string; // ISO date string
    paidAt?: string; // ISO date string
    paymentMethod?: string; // Ex: "Bank Transfer", "PayPal"
    paymentDetails?: string; // Additional details for the payment method
    notes?: string;
    totalHT: number;
    totalVAT: number;
    totalTTC: number;
    currency: string; // Currency code, e.g., "EUR", "USD"
    isActive: boolean;
}