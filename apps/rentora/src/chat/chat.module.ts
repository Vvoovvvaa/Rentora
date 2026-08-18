import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { Message } from '@app/common-rentora/database/entity/message';
import { ChatRoom, Property } from '@app/common-rentora/database/entity';
import { ChatService } from './chat.service';

@Module({
  imports: [TypeOrmModule.forFeature([Message, ChatRoom, Property])],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
