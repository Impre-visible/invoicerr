import { Currency } from "@prisma/client";

export class EditClientsDto {
    description?: string
    legalId?: string
    VAT?: string
    foundedAt?: Date;
    id: string;
    name: string;
    contactFirstname: string;
    contactLastname: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    currency: Currency;
    isActive: boolean;
}