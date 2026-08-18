import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { WsAuthGuard } from '@app/common-rentora/guard';
import { ChatService } from './chat.service';

interface SendMessagePayload {
  roomId: number;
  text: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(socket: Socket): void {
    console.log(`User connected: ${socket.id}`);
  }

  handleDisconnect(socket: Socket): void {
    console.log(`User disconnected: ${socket.id}`);
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('joinRoom')
  async joinRoom(
    @MessageBody() roomId: number,
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.user.id;

    await this.chatService.checkRoomAccess(roomId, userId);

    await socket.join(roomId.toString());

    console.log(`User ${userId} joined room ${roomId}`);

    return { success: true };
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('sendMessage')
  async sendMessage(
    @MessageBody() data: SendMessagePayload,
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.user.id;

    await this.chatService.checkRoomAccess(data.roomId, userId);

    const message = await this.chatService.createMessage({
      roomId: data.roomId,
      senderId: userId,
      text: data.text,
    });

    this.server.to(data.roomId.toString()).emit('newMessage', message);

    return message;
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('getMessages')
  async getMessages(
    @MessageBody() roomId: number,
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.user.id;

    await this.chatService.checkRoomAccess(roomId, userId);

    return await this.chatService.getMessages(roomId);
  }
}
