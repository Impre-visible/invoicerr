import { BadRequestException, Injectable } from '@nestjs/common';

import { CurrentUser } from 'src/types/user';
import { MailService } from 'src/mail/mail.service';
import prisma from 'src/prisma/prisma.service';

@Injectable()
export class DangerService {

    private readonly otpExpirationMinutes = 10;

    private OTP: string | null = null; // Store the OTP in memory for the session, as it is not persisted in the database
    private otpExpirationTime: Date | null = null; // Store the expiration time of the OTP

    constructor(private readonly mailService: MailService) {
    }

    async requestOtp(user: CurrentUser) {
        const otp = Math.floor(10000000 + Math.random() * 90000000).toString();

        this.OTP = otp;
        this.otpExpirationTime = new Date(new Date().getTime() + this.otpExpirationMinutes * 60000);

        try {
            await this.mailService.sendMail({
                to: process.env.SMTP_FROM || process.env.SMTP_USER,
                subject: 'OTP Code Sent',
                text: `An OTP code was sent to ${user.email}. The code is: ${otp}. It is valid for ${this.otpExpirationMinutes} minutes.`,
            })
        } catch (error) {
            throw new BadRequestException('Failed to send OTP email. Please check your SMTP configuration.');
        }

        return { message: 'OTP sent successfully' };
    }

    private isOtpValid(otp: string): boolean {
        otp = otp.replace(/-/g, '');
        if (!this.OTP || !this.otpExpirationTime) {
            return false;
        }

        const isValid = this.OTP === otp && new Date() < this.otpExpirationTime;
        return isValid;
    }

    async resetApp(user: CurrentUser, otp: string) {
        if (!this.isOtpValid(otp)) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        // Reset everything but the user data
        await prisma.company.deleteMany();
        await prisma.pDFConfig.deleteMany();
        await prisma.mailTemplate.deleteMany();
        await prisma.client.deleteMany();
        await prisma.quoteItem.deleteMany();
        await prisma.quote.deleteMany();
        await prisma.invoiceItem.deleteMany();
        await prisma.invoice.deleteMany();
        await prisma.signature.deleteMany();


        return { message: 'Application reset successfully' };
    }

    async resetAll(user: CurrentUser, otp: string) {
        if (!this.isOtpValid(otp)) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        // Reset all data logic here
        // For example, clear all user data, reset application state, etc.

        this.OTP = null; // Clear OTP after use
        this.otpExpirationTime = null; // Clear expiration time

        return { message: 'All data reset successfully' };
    }
}
