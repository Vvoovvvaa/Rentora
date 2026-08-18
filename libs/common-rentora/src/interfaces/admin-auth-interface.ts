export interface AdminJwtPayload {
  sub: number;
  gmail: string;
  role: string;
  type: 'ADMIN';
  iat?: number;
  exp?: number;
}

export interface AdminAuthUser {
  id: number;
  gmail: string;
  role: string;
  type: 'ADMIN';
}
