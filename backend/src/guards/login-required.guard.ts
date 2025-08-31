import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { AuthService } from 'src/models/auth/auth.service';
import { CurrentUser } from 'src/types/user';
import { JwtService } from '@nestjs/jwt';
import { RequestWithUser } from 'src/types/request';
import prisma from 'src/prisma/prisma.service';

@Injectable()
export class LoginRequiredGuard implements CanActivate {
  private jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

  constructor(
    private readonly jwt: JwtService
  ) {
    if (process.env.OIDC_JWKS_URI) {
      try {
        this.jwks = createRemoteJWKSet(new URL(process.env.OIDC_JWKS_URI || ''));
      } catch (error) {
        Logger.error('Failed to create JWKS set:', error);
      }
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse();
    let authHeader = request.headers['authorization'];

    if (!authHeader && request.cookies && request.cookies['access_token']) {
      authHeader = request.cookies['access_token'];
    }


    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    let payload: { sub: string; email: string; name?: string };

    try {
      payload = this.jwt.verify(token, {
        secret: AuthService.getJWTSecret(),
      });

      if (!payload.sub || !payload.email) {
        response.setHeader('WWW-Authenticate', 'expired_token');
        throw new UnauthorizedException('Invalid JWT payload');
      }
    } catch (err) {
      if (!this.jwks) {
        response.setHeader('WWW-Authenticate', 'expired_token');
        throw new UnauthorizedException('No JWT and the OIDC_JWKS_URI is not set');
      }
      try {
        const result = await jwtVerify(token, this.jwks, {
          issuer: process.env.OIDC_ISSUER,
          audience: process.env.OIDC_CLIENT_ID,
        });

        const claims = result.payload;
        if (!claims.sub || !claims.email) {
          response.setHeader('WWW-Authenticate', 'expired_token');
          throw new UnauthorizedException('Invalid OIDC token claims');
        }

        payload = {
          sub: claims.sub as string,
          email: claims.email as string,
          name: claims.name as string,
        };
      } catch (err) {
        response.setHeader('WWW-Authenticate', 'expired_token');
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    const user = await prisma.user.findFirst({
      where: { email: payload.email },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    request.user = {
      ...user,
      accessToken: token,
    } as CurrentUser;

    return true;
  }
}
