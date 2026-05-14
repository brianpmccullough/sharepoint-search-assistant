import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { NO_AUTHENTICATION_KEY } from '../decorators/no-authentication.decorator';

@Injectable()
export class JwtBearerGuard extends AuthGuard('azure-ad-jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const noAuthentication = this.reflector.getAllAndOverride<boolean>(
      NO_AUTHENTICATION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (noAuthentication) {
      return true;
    }
    return super.canActivate(context);
  }
}
