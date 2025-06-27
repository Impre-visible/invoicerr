import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthService } from 'src/models/auth/auth.service';
import { CurrentUser } from 'src/types/user';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RequestWithUser } from 'src/types/request';

@Injectable()
export class LoginRequiredGuard implements CanActivate {

  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse();
    const token = request.headers['authorization'];

    if (!token || typeof token !== 'string' || !token.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const accessToken = token.slice(7); // remove "Bearer "

    if (!accessToken) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      let payload: { sub: string, email: string, iat: number, exp: number };

      try {
        payload = this.jwt.verify<typeof payload>(accessToken, {
          secret: AuthService.getJWTSecret(),
        });
        if (payload && payload.exp < Math.floor(Date.now() / 1000)) {
          response.setHeader('WWW-Authenticate', 'expired_token');
          throw new UnauthorizedException('Access token has expired');
        }
      } catch (error) {
        response.setHeader('WWW-Authenticate', 'expired_token');
        console.error('JWT verification failed:', error);
        throw new UnauthorizedException('Invalid access token');
      }

      if (!payload || !payload.sub || !payload.email) {
        throw new UnauthorizedException('Invalid access token payload');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
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
        accessToken,
      } as CurrentUser;
    } catch (error) {
      console.error('Error in LoginRequiredGuard:', error);
      throw new UnauthorizedException('Invalid access token');
    }

    return true;
  }
}