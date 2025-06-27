import { EditCompanyDto } from './dto/company.dto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CompanyService {
    constructor(private readonly prisma: PrismaService) { }

    getCompanyInfo() {
        return this.prisma.company.findFirst();
    }

    async editCompanyInfo(editCompanyDto: EditCompanyDto) {
        const data = { ...editCompanyDto };
        const existingCompany = await this.prisma.company.findFirst();

        return existingCompany
            ? this.prisma.company.update({
                where: { id: existingCompany.id },
                data,
            })
            : this.prisma.company.create({ data });
    }
}
