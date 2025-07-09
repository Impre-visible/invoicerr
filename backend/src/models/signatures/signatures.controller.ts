import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';

import { LoginRequired } from 'src/decorators/login-required.decorator';
import { SignaturesService } from './signatures.service';
import { sign } from 'crypto';

@Controller('signatures')
export class SignaturesController {
    constructor(private readonly signaturesService: SignaturesService) { }

    @Get('/:id')
    async getSignature(@Param('id') signatureId: string) {
        return (await this.signaturesService.getSignature(signatureId)) || {}
    }

    @Post('/')
    @LoginRequired()
    async createSignature(@Body('quoteId') quoteId: string) {
        return this.signaturesService.createSignature(quoteId);
    }

    @Post('/:id/otp')
    async generateOTPCode(@Param('id') signatureId: string) {
        return this.signaturesService.generateOTPCode(signatureId);
    }

    @Post('/:id/sign')
    async signQuote(@Param('id') signatureId: string, @Body('otpCode') otpCode: string) {
        return this.signaturesService.signQuote(signatureId, otpCode);
    }
}
