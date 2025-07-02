export interface Client {
    id: string;
    name: string;
    description: string;
    legalId?: string;
    VAT?: string;
    foundedAt: Date;
    contactFirstname: string;
    contactLastname: string;
    contactEmail: string;
    contactPhone?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    isActive?: boolean;
}
