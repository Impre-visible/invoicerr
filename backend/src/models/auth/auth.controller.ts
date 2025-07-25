import { BadRequestException, Body, Controller, Get, InternalServerErrorException, Patch, Post, Query, Res, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';

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

    @Get('oidc/login')
    redirectToProvider(@Res() res: Response) {
        const state = crypto.randomUUID(); // ou un state + CSRF

        const clientId = process.env.OIDC_CLIENT_ID;
        const redirectUri = process.env.OIDC_CALLBACK_URL;
        const authEndpoint = process.env.OIDC_AUTHORIZATION_ENDPOINT;

        if (!clientId || !redirectUri || !authEndpoint) {
            throw new InternalServerErrorException('OIDC env variables missing');
        }

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: 'openid profile email',
            state,
        });

        res.redirect(`${authEndpoint}?${params.toString()}`);
    }

    @Get('callback')
    async oidcCallback(
        @Query('code') code: string,
        @Res() res: Response,
    ) {
        if (!code) {
            throw new BadRequestException('Missing code parameter in OIDC callback');
        }

        try {
            const tokens = await this.authService.exchangeCodeForTokens(code);
            const userInfo = await this.authService.processIdToken(tokens.id_token);
            const jwt = await this.authService.loginOrCreateUserFromOidc(userInfo);
            res.cookie('access_token', jwt.accessToken, { httpOnly: true, secure: true });
            res.redirect('/');
        } catch (error) {
            console.error(error);
            throw new UnauthorizedException('OIDC authentication failed');
        }
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
    async getSignin(@Body() body: SignupDto, @Res() res: Response) {
        const { email, password } = body;
        try {
            const tokens = await this.authService.signIn(email, password);
            res.cookie('access_token', tokens.access_token, { httpOnly: true, secure: true });
            res.cookie('refresh_token', tokens.refresh_token, { httpOnly: true, secure: true });
            res.send({ message: 'Connexion réussie' });
        } catch (error) {
            throw new UnauthorizedException('Échec de la connexion');
        }
    }

    @Post('refresh')
    async refreshTokens(@Res() res: Response, @Body() body: { refreshToken?: string }) {
        const refreshToken = body.refreshToken || res.req.cookies['refresh_token'];
        if (!refreshToken) {
            throw new UnauthorizedException('Token de rafraîchissement manquant');
        }
        try {
            const tokens = await this.authService.refreshToken(refreshToken);
            res.cookie('access_token', tokens.access_token, { httpOnly: true, secure: true });
            res.send({ message: 'Tokens rafraîchis avec succès' });
        } catch (error) {
            throw new UnauthorizedException('Échec du rafraîchissement des tokens');
        }
    }

    @Post('logout')
    async logout(@Res() res: Response) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        res.send({ message: 'Déconnexion réussie' });
    }
}
