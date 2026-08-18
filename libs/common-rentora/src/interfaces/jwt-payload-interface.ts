import { userRoles } from '../enums';

export interface JwtPayload {
  sub: number;
  role: userRoles;
  phone?: string;
  temp?: boolean;
  jti: string;
  iat?: number;
  exp?: number;
}
