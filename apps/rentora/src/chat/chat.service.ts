import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ChatRoom, Message, Property } from '@app/common-rentora/database/entity';


@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,

        @InjectRepository(ChatRoom)
        private readonly chatRoomRepository: Repository<ChatRoom>,

        @InjectRepository(Property)
        private readonly propertyRepository: Repository<Property>
    ) { }

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
                roomId
            },
            order: {
                createdAt: 'ASC'
            }
        });
    }

    async createRoom(data: { propertyId: number; clientId: number; }) {
        const property = await this.propertyRepository.findOne({
            where: {
                id: data.propertyId
            },
            relations: {
                owner: true
            }
        });


        if (!property) {
            throw new BadRequestException(
                'Property not found'
            );
        }


        if (property.owner.id === data.clientId) {
            throw new BadRequestException(
                'You cannot create chat with yourself'
            );
        }


        const existingRoom =
            await this.chatRoomRepository.findOne({
                where: {
                    propertyId: data.propertyId,
                    clientId: data.clientId
                }
            });


        if (existingRoom) {
            return existingRoom;
        }


        const room =
            this.chatRoomRepository.create({
                propertyId: property.id,
                ownerId: property.owner.id,
                clientId: data.clientId
            });

        return await this.chatRoomRepository.save(room);
    }

    async getUserRooms(userId: number) {
        return await this.chatRoomRepository.find({
            where: [
                {
                    ownerId: userId
                },
                {
                    clientId: userId
                }
            ]
        });
    }

  async checkRoomAccess(roomId: number, userId: number) {

    const room = await this.chatRoomRepository.findOne({
        where: {
            id: roomId
        }
    });


    if (!room) {
        throw new BadRequestException(
            'Room not found'
        );
    }


    if (
        room.ownerId !== userId &&
        room.clientId !== userId
    ) {
        throw new ForbiddenException(
            'Access denied'
        );
    }


    return true;
}
}