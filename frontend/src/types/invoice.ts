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
    number: number; // Ex: "INV-2025-0001"
    rawNumber?: string; // Optional raw number for custom formats
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

export enum RecurrenceFrequency {
    WEEKLY = 'WEEKLY',
    BIWEEKLY = 'BIWEEKLY',
    MONTHLY = 'MONTHLY',
    BIMONTHLY = 'BIMONTHLY',
    QUARTERLY = 'QUARTERLY',
    QUADMONTHLY = 'QUADMONTHLY',
    SEMIANNUALLY = 'SEMIANNUALLY',
    ANNUALLY = 'ANNUALLY'
}

export interface RecurringInvoiceItem {
    id: string;
    recurringInvoiceId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number; // 20 for 20%
    order: number;
}

export interface RecurringInvoice {
    id: string;
    clientId: string;
    client: Client;
    companyId: string;
    company: Company;
    items: RecurringInvoiceItem[];
    paymentMethod?: string; // Ex: "Bank Transfer", "PayPal", "Cash"
    paymentDetails?: string; // Details for the payment method (e.g., bank account number)
    notes?: string;
    totalHT: number;
    totalVAT: number;
    totalTTC: number;
    currency: string; // Currency code, e.g., "EUR", "USD"
    frequency: RecurrenceFrequency; // Simplified recurrence frequency
    count?: number; // Number of occurrences, null for infinite
    until?: Date | string; // ISO date string for end date of the recurrence
    autoSend?: boolean; // Auto-send generated invoices
    nextInvoiceDate?: Date | string; // Date for the next invoice generation
    lastInvoiceDate?: Date | string; // Date of the last generated invoice
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
}