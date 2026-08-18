import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  user: {
    id: number;
    role: string;
    gmail: string;
  };
}
