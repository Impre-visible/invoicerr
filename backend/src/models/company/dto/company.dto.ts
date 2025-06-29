import { finance } from "@fin.cx/einvoice/dist_ts/plugins"

export class EditCompanyDto {
    description: string
    legalId: string
    foundedAt: Date
    name: string
    language: string
    currency: finance.TCurrency
    VAT: string
    address: string
    postalCode: string
    city: string
    country: string
    phone: string
    email: string
}