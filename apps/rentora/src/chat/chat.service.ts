import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';

import {
  ChatRoom,
  Message,
  Property,
} from '@app/common-rentora/database/entity';

import { AnalyticService } from '../analytic/analytic.service';

export type ChatMessageResponse = {
  id: number;
  roomId: number;
  senderId: number;
  text: string;
  createdAt: Date;
};

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,

    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,

    private readonly i18n: I18nService,
    private readonly analyticService: AnalyticService,
  ) {}

  private t(key: string, args?: Record<string, any>): string {
    return this.i18n.t(key, {
      lang: I18nContext.current()?.lang || 'en',
      args,
    });
  }

  async createMessage(data: {
    roomId: number;
    senderId: number;
    text: string;
  }): Promise<ChatMessageResponse> {
    // `Message` owns relation columns rather than scalar `roomId`/`senderId`
    // columns. Supplying the relations is what persists both foreign keys.
    const message = this.messageRepository.create({
      text: data.text,
      user: { id: data.senderId },
      chatRomms: { id: data.roomId },
    });

    const savedMessage = await this.messageRepository.save(message);

    return {
      id: savedMessage.id,
      roomId: data.roomId,
      senderId: data.senderId,
      text: savedMessage.text,
      createdAt: savedMessage.createdAt,
    };
  }

  async getMessages(roomId: number): Promise<ChatMessageResponse[]> {
    const messages = await this.messageRepository.find({
      where: {
        chatRomms: {
          id: roomId,
        },
      },
      relations: {
        chatRomms: true,
        user: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    return messages.map((message) => ({
      id: message.id,
      roomId: message.chatRomms.id,
      senderId: message.user.id,
      text: message.text,
      createdAt: message.createdAt,
    }));
  }

  async createRoom(data: {
    propertyId: number;
    clientId: number;
  }) {
    const property = await this.propertyRepository.findOne({
      where: {
        id: data.propertyId,
      },
      relations: {
        owner: true,
      },
    });

    if (!property) {
      throw new BadRequestException(
        this.t('chat.PROPERTY_NOT_FOUND'),
      );
    }

    if (property.owner.id === data.clientId) {
      throw new BadRequestException(
        this.t('chat.CANNOT_CHAT_WITH_YOURSELF'),
      );
    }

    const existingRoom = await this.chatRoomRepository.findOne({
      where: {
        property: {
          id: data.propertyId,
        },
        client: {
          id: data.clientId,
        },
      },
      relations: {
        property: true,
        owner: true,
        client: true,
      },
    });

    if (existingRoom) {
      return existingRoom;
    }

    const room = this.chatRoomRepository.create({
      property,
      owner: property.owner,
      client: {
        id: data.clientId,
      },
    });

    const savedRoom = await this.chatRoomRepository.save(room);

    await this.analyticService.addChat(data.propertyId);

    return savedRoom;
  }

  async getUserRooms(userId: number) {
    return this.chatRoomRepository.find({
      where: [
        {
          owner: {
            id: userId,
          },
        },
        {
          client: {
            id: userId,
          },
        },
      ],
      relations: {
        property: true,
        owner: true,
        client: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async checkRoomAccess(roomId: number, userId: number) {
    const room = await this.chatRoomRepository.findOne({
      where: {
        id: roomId,
      },
      relations: {
        owner: true,
        client: true,
      },
    });

    if (!room) {
      throw new BadRequestException(
        this.t('chat.ROOM_NOT_FOUND'),
      );
    }

    if (
      room.owner.id !== userId &&
      room.client.id !== userId
    ) {
      throw new ForbiddenException(
        this.t('chat.ACCESS_DENIED'),
      );
    }

    return true;
  }
}
