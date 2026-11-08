import { ExecutionContext, Injectable, createParamDecorator } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthUser } from './jwt.strategy';

/** Bảo vệ route bằng JWT (Bearer token). MVP chỉ có vai trò khách hàng nên không có phân quyền theo role. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest<{ user: AuthUser }>().user,
);
