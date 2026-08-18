import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Base } from './base';
import { User } from './user';

@Entity('user_security')
export class UserSecurity extends Base {
  @Column({ name: 'temporary_block', default: 0 })
  temporaryBlock: number;

  @Column({ name: 'permanetly_block', default: false })
  permanetlyBlock: boolean;

  @Column({ name: 'total_attemps', default: 0 })
  totalAttemps: number;

  @Column({ type: 'timestamp', nullable: true })
  temporaryBlockUntil: Date | null;

  @OneToOne(() => User, (user) => user.security)
  @JoinColumn()
  user: User;
}
