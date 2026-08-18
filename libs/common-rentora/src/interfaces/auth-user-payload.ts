import { userRoles } from '../enums';

export interface AuthUserPayload {
  id: number;
  role: userRoles;
  gmail?: string;
  temp?: boolean;
}
