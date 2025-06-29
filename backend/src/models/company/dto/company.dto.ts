import { finance } from "@fin.cx/einvoice/dist_ts/plugins"

export class EditCompanyDto {
    name: string
    language: string
    currency: finance.TCurrency
    VAT: string
    address?: string
    postalCode?: string
    city?: string
    country?: string
    phone?: string
    email?: string
}