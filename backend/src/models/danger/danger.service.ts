import * as nodemailer from 'nodemailer';

import { BadRequestException, Injectable } from '@nestjs/common';

import { CurrentUser } from 'src/types/user';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DangerService {
    private transporter: nodemailer.Transporter;

    private readonly otpExpirationMinutes = 10;

    private OTP: string | null = null; // Store the OTP in memory for the session, as it is not persisted in the database
    private otpExpirationTime: Date | null = null; // Store the expiration time of the OTP

    constructor(private readonly prisma: PrismaService) {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: 587,
            secure: false, // true si port 465
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    }

    async requestOtp(user: CurrentUser) {
        const otp = Math.floor(10000000 + Math.random() * 90000000).toString();

        this.OTP = otp;
        this.otpExpirationTime = new Date(new Date().getTime() + this.otpExpirationMinutes * 60000);

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: user.email,
            subject: 'Your OTP Code',
            text: `Your OTP code is: ${otp}. It is valid for ${this.otpExpirationMinutes} minutes.`,
        };

        try {
            await this.transporter.sendMail(mailOptions);
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
        await this.prisma.company.deleteMany();
        await this.prisma.pDFConfig.deleteMany();
        await this.prisma.mailTemplate.deleteMany();
        await this.prisma.client.deleteMany();
        await this.prisma.quoteItem.deleteMany();
        await this.prisma.quote.deleteMany();
        await this.prisma.invoiceItem.deleteMany();
        await this.prisma.invoice.deleteMany();
        await this.prisma.signature.deleteMany();


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
