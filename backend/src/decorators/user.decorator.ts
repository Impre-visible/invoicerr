import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { CurrentUser } from 'src/types/user';
import { RequestWithUser } from 'src/types/request';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest() as RequestWithUser;
    return request.user;
  },
);
