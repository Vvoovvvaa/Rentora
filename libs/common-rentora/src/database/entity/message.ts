import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user';
import { ChatRoom } from './chat-room';
import { Base } from './base';

@Entity('message')
export class Message extends Base {

  @Column()
  text: string;

  @ManyToOne(() => User, user => user.sender, { onDelete : 'CASCADE'})
  @JoinColumn({name: 'sneder_id'})
  user: User

  @ManyToOne(() => ChatRoom, chatRooms => chatRooms.message)
  chatRomms: ChatRoom
  
}
