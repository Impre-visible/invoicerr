export interface Company {
    id: string
    description: string
    foundedAt: Date | string
    name: string
    currency: string
    VAT: string
    address: string
    postalCode: string
    city: string
    country: string
    phone: string
    email: string
    quoteStartingNumber: number
    quoteNumberFormat: string
    invoiceStartingNumber: number
    invoiceNumberFormat: string
}
