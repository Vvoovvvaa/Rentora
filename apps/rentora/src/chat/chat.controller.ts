import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { ChatService } from './chat.service';
import { AuthGuard } from '@app/common-rentora/guard';
import { AuthUser } from '@app/common-rentora/decorators';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('room')
  @UseGuards(AuthGuard)
  async createRoom(
    @Body() data: { propertyId: number },
    @AuthUser('id') clientId: number,
  ) {
    return await this.chatService.createRoom({
      propertyId: data.propertyId,
      clientId,
    });
  }

  @Get('rooms')
  @UseGuards(AuthGuard)
  async getRooms(@AuthUser('id') userId: number) {
    return await this.chatService.getUserRooms(userId);
  }

  @Get(':roomId/messages')
  @UseGuards(AuthGuard)
  async getMessages(
    @Param('roomId') roomId: number,
    @AuthUser('id') userId: number,
  ) {
    await this.chatService.checkRoomAccess(roomId, userId);

    return await this.chatService.getMessages(roomId);
  }
}
