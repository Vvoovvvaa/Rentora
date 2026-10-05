import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Base } from './base';
import { SubscripptionPlanEnum, userRoles } from '../../enums';
import { UserSecurity } from './user-security';
import { accauntSatus } from '../../enums/accaunt-status';
import { EmailStatusEnum } from '../../enums/email-status';
import { SecretCode } from './secret-code';
import { Property } from './property';
import { UserImage } from './user-images';
import { Favorites } from './favorites';
import { Report } from './report';
import { Support } from './support';
import { PropertyViews } from './property-views';
import { ChatRoom } from './chat-room';
import { Message } from './message';
import { UserSubscription } from './subscription-plan';

@Entity('users')
export class User extends Base {
  @Column()
  name: string;

  @Column({ unique: true })
  phone: string;

  @Column()
  age: number;

  @Column({unique: true})
  gmail: string;

  @Column({
    type: 'enum',
    enum: EmailStatusEnum,
    default: EmailStatusEnum.NOT_VERIFIED,
    name: 'gmail_status',
  })
  gmailStatus: EmailStatusEnum;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: userRoles,
    name: 'user_role',
    default: userRoles.USER,
  })
  userRole: userRoles;

  @Column({
    type: 'enum',
    enum: accauntSatus,
    default: accauntSatus.ACTIVE,
    name: 'accaunt_status',
  })
  accauntStatus: accauntSatus;

  @OneToOne(() => UserSecurity, (security) => security.user)
  security: UserSecurity;

  @OneToOne(() => SecretCode, (secretCode) => secretCode.user)
  secretCode: SecretCode;

  @OneToMany(() => Property, (property) => property.owner)
  properties: Property[];

  @OneToOne(() => UserImage, (image) => image.user, {
    onDelete: 'CASCADE',
    nullable: true,
    cascade: true,
  })
  @JoinColumn()
  image: UserImage;

  @OneToMany(() => Favorites, (fav) => fav.user)
  favorites: Favorites[];

  @OneToMany(() => Report, (report) => report.user)
  report: Report;

  @OneToMany(() => Support, (support) => support.user, { onDelete: 'CASCADE' })
  support: Support;

  @OneToMany(() => PropertyViews, (views) => views.user, {
    onDelete: 'CASCADE',
  })
  views: PropertyViews[];

  @ManyToOne(() => ChatRoom, (chatrooms) => chatrooms.owner)
  ownerChatRooms: ChatRoom;

  @ManyToOne(() => ChatRoom, (chatrooms) => chatrooms.client)
  clientChatRooms: ChatRoom;

  @OneToMany(() => Message, (message) => message.user)
  sender: Message[];

  @OneToMany(() => UserSubscription, (subscriptions) => subscriptions.user, {
    onDelete: 'CASCADE',
  })
  subscriptions: UserSubscription[];
}
