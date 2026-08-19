import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  OneToMany,
} from 'typeorm';

import { User } from './user';
import { Property } from './property';
import { Message } from './message';
import { Base } from './base';

@Entity('chat-room')
export class ChatRoom extends Base{

  @ManyToOne(() => Property, (property) => property.chatRooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @ManyToOne(() => User, (user) => user.ownerChatRooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @ManyToOne(() => User, (user) => user.clientChatRooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @OneToMany(() => Message,message => message.chatRomms )
  message: Message

}