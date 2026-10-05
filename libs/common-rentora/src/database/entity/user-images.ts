import { Column, Entity, OneToOne } from 'typeorm';
import { Base } from './base';
import { User } from './user';

@Entity('user-image')
export class UserImage extends Base {
  @Column()
  url: string;

  @Column()
  size: number;

  @Column({ name: 'public_id' })
  publicId: string;

  @OneToOne(() => User, (user) => user.image, { onDelete: 'CASCADE' })
  user: User;
}
