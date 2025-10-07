import { AllowAnonymous } from '@/decorators/allow-anonymous.decorator';
import { User } from '@/decorators/user.decorator';
import { AuthService } from '@/modules/auth/auth.service';
import { SignupDto } from '@/modules/auth/dto/signup.dto';
import { CurrentUser } from '@/types/user';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Patch,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';


@Controller('auth')
export class AuthController {

  isHttps: boolean;

  constructor(private readonly authService: AuthService) {
    if (process.env?.APP_URL !== undefined) {
      this.isHttps = process.env.APP_URL.startsWith('https');
    } else {
      this.isHttps = true; // true by default for safety in production
    }
  }

  @Get('me')
  getMe(@User() user: CurrentUser) {
    return this.authService.getMe(user.id);
  }

  @Get('oidc/login')
  @AllowAnonymous()
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
  @AllowAnonymous()
  async oidcCallback(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      throw new BadRequestException('Missing code parameter in OIDC callback');
    }

    try {
      const tokens = await this.authService.exchangeCodeForTokens(code);
      const userInfo = await this.authService.processIdToken(tokens.id_token);
      const jwt = await this.authService.loginOrCreateUserFromOidc(userInfo);
      res.cookie('access_token', jwt.accessToken, {
        httpOnly: true,
        secure: this.isHttps,
      });
      res.redirect('/');
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('OIDC authentication failed');
    }
  }

  @Patch('me')
  updateMe(@User() user: CurrentUser, @Body() body: SignupDto) {
    return this.authService.updateMe(
      user.id,
      body.firstname,
      body.lastname,
      body.email,
    );
  }

  @Patch('password')
  updatePassword(
    @User() user: CurrentUser,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.updatePassword(
      user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Post('signup')
  @AllowAnonymous()
  getSignup(@Body() body: SignupDto) {
    return this.authService.signUp(
      body.firstname,
      body.lastname,
      body.email,
      body.password,
    );
  }

  @Post('login')
  @AllowAnonymous()
  async getSignin(@Body() body: SignupDto, @Res() res: Response) {
    const { email, password } = body;
    try {
      const tokens = await this.authService.signIn(email, password);
      res.cookie('access_token', tokens.access_token, {
        httpOnly: true,
        secure: this.isHttps,
      });
      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: this.isHttps,
      });
      res.send({ message: 'Connexion réussie' });
    } catch (error) {
      throw new UnauthorizedException('Échec de la connexion');
    }
  }

  @Post('refresh')
  @AllowAnonymous()
  async refreshTokens(@Res() res: Response) {
    const refreshToken = res.req.cookies['refresh_token'];

    if (!refreshToken) {
      throw new UnauthorizedException('Token de rafraîchissement manquant');
    }
    try {
      const tokens = await this.authService.refreshToken(refreshToken);
      res.cookie('access_token', tokens.access_token, {
        httpOnly: true,
        secure: this.isHttps,
      });
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
