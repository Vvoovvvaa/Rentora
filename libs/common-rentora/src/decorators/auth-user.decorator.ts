import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthUserPayload } from '../interfaces';

type AuthRequest = Request & {
  user: AuthUserPayload;
};

export const AuthUser = createParamDecorator(
  (field: keyof AuthUserPayload | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    return field ? request.user[field] : request.user;
  },
);
