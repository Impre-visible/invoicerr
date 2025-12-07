import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { IS_PUBLIC_KEY } from '@/decorators/public.decorator';
import { Reflector } from '@nestjs/core';
import { auth } from '@/lib/auth';
import { fromNodeHeaders } from 'better-auth/node';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const headers = fromNodeHeaders(request.headers);

    const session = await auth.api.getSession({
      headers,
    });

    if (!session) {
      throw new UnauthorizedException();
    }

    request.user = session.user;
    request.session = session.session;

    return true;
  }
}