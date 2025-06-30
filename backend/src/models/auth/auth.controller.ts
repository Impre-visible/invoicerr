import { Body, Controller, Get, Patch, Post } from '@nestjs/common';

import { LoginRequired } from 'src/decorators/login-required.decorator';
import { User } from 'src/decorators/user.decorator';
import { CurrentUser } from 'src/types/user';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { }

    @Get('me')
    @LoginRequired()
    getMe(@User() user: CurrentUser) {
        return this.authService.getMe(user.id);
    }

    @Patch('me')
    @LoginRequired()
    updateMe(@User() user: CurrentUser, @Body() body: SignupDto) {
        return this.authService.updateMe(user.id, body.firstname, body.lastname, body.email);
    }

    @Patch('password')
    @LoginRequired()
    updatePassword(@User() user: CurrentUser, @Body() body: { currentPassword: string, newPassword: string }) {
        return this.authService.updatePassword(user.id, body.currentPassword, body.newPassword);
    }

    @Post('signup')
    getSignup(@Body() body: SignupDto) {
        return this.authService.signUp(body.firstname, body.lastname, body.email, body.password);
    }

    @Post('login')
    getSignin(@Body() body: SignupDto) {
        return this.authService.signIn(body.email, body.password);
    }

    @Post('refresh')
    refreshTokens(@Body() body: { refreshToken: string }) {
        return this.authService.refreshToken(body.refreshToken);
    }

}
