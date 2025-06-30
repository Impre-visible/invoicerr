import { BadRequestException, Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';

import { CurrentUser } from 'src/types/user';
import { DangerService } from './danger.service';
import { LoginRequired } from 'src/decorators/login-required.decorator';
import { User } from 'src/decorators/user.decorator';

@Controller('danger')
export class DangerController {

    constructor(private readonly dangerService: DangerService) {
    }

    @Post('otp')
    @LoginRequired()
    async requestOtp(@User() user: CurrentUser) {
        return this.dangerService.requestOtp(user);
    }

    @Post('reset/app')
    @LoginRequired()
    async resetApp(@User() user: CurrentUser, @Query('otp') otp: string) {
        if (!otp) {
            throw new BadRequestException('OTP is required for this action');
        }
        return this.dangerService.resetApp(user, otp);
    }

    @Post('reset/all')
    @LoginRequired()
    async resetAll(@User() user: CurrentUser, @Query('otp') otp: string) {
        if (!otp) {
            throw new BadRequestException('OTP is required for this action');
        }
        return this.dangerService.resetAll(user, otp);
    }


}
