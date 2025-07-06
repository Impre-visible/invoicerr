import { Company, PrismaClient } from "@prisma/client";

import { format } from "date-fns";

export const formatDate = async (date?: Date | null, company?: Company | null) => {
    if (!date) return 'N/A';

    if (!company) {
        const prisma = new PrismaClient();
        company = await prisma.company.findFirst();
        if (!company) {
            throw new Error('Company not found');
        }
    }

    let dateFormat = company.dateFormat;
    const allowedFormats = ['dd/mm/yyyy', 'mm/dd/yyyy', 'yyyy/mm/dd', 'dd.mm.yyyy', 'dd-mm-yyyy', 'yyyy-mm-dd', 'EEEE, dd MMM yyyy'];
    if (!allowedFormats.includes(dateFormat)) {
        dateFormat = 'dd/mm/yyyy'; // Default to dd/mm/yyyy if the format is not recognized
    }
    format(date, dateFormat);
};