import { finance } from "@fin.cx/einvoice/dist_ts/plugins"

export interface PDFConfig {
    fontFamily: string
    includeLogo: boolean
    logoB64: string | null
    padding: number
    primaryColor: string
    secondaryColor: string
    labels: {
        billTo: string
        description: string
        dueDate: string
        date: string
        grandTotal: string
        invoice: string
        quantity: string
        quote: string
        quoteFor: string
        subtotal: string
        total: string
        unitPrice: string
        validUntil: string
        vat: string
        vatRate: string
        notes: string
        paymentMethod: string
        paymentDetails: string

        legalId: string
        VATId: string
    }
}

export class EditCompanyDto {
    description: string
    legalId?: string
    foundedAt: Date
    name: string
    currency: finance.TCurrency
    VAT?: string
    address: string
    postalCode: string
    city: string
    country: string
    phone: string
    email: string
    pdfConfig: PDFConfig
    quoteStartingNumber: number
    quoteNumberFormat: string
    invoiceStartingNumber: number
    invoiceNumberFormat: string
}