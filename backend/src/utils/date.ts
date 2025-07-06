import { Company, PrismaClient } from "@prisma/client";

import { format } from "date-fns";

export const formatDate = (company: Company, date?: Date | null,) => {
    if (!date) return 'N/A';

    let dateFormat = company.dateFormat;
    const allowedFormats = ['dd/LL/yyyy', 'LL/dd/yyyy', 'yyyy/LL/dd', 'dd.LL.yyyy', 'dd-LL-yyyy', 'yyyy-LL-dd', 'EEEE, dd MMM yyyy'];
    if (!allowedFormats.includes(dateFormat)) {
        dateFormat = 'dd/LL/yyyy'; // Default format if the stored format is invalid
    }
    return format(date, dateFormat);
};