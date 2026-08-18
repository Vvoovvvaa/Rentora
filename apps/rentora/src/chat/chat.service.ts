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
  }) {
    const message = this.messageRepository.create(data);

    return await this.messageRepository.save(message);
  }

  async getMessages(roomId: number) {
    return await this.messageRepository.find({
      where: {
        roomId,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async createRoom(data: { propertyId: number; clientId: number }) {
    const property = await this.propertyRepository.findOne({
      where: {
        id: data.propertyId,
      },
      relations: {
        owner: true,
      },
    });

    if (!property) {
      throw new BadRequestException(this.t('chat.PROPERTY_NOT_FOUND'));
    }

    if (property.owner.id === data.clientId) {
      throw new BadRequestException(this.t('chat.CANNOT_CHAT_WITH_YOURSELF'));
    }

    const existingRoom = await this.chatRoomRepository.findOne({
      where: {
        propertyId: data.propertyId,
        clientId: data.clientId,
      },
    });

    if (existingRoom) {
      return existingRoom;
    }

    const room = this.chatRoomRepository.create({
      propertyId: property.id,
      ownerId: property.owner.id,
      clientId: data.clientId,
    });

    return await this.chatRoomRepository.save(room);
  }

  async getUserRooms(userId: number) {
    return await this.chatRoomRepository.find({
      where: [
        {
          ownerId: userId,
        },
        {
          clientId: userId,
        },
      ],
    });
  }

  async checkRoomAccess(roomId: number, userId: number) {
    const room = await this.chatRoomRepository.findOne({
      where: {
        id: roomId,
      },
    });

    if (!room) {
      throw new BadRequestException(this.t('chat.ROOM_NOT_FOUND'));
    }

    if (room.ownerId !== userId && room.clientId !== userId) {
      throw new ForbiddenException(this.t('chat.ACCESS_DENIED'));
    }

    return true;
  }
}
