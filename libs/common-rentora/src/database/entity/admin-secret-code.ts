import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Base } from './base';
import { Admin } from './admin';

@Entity('admin_secret_code')
export class AdminSecretcode extends Base {
  @Column({ nullable: false })
  code: string;

  @OneToOne(() => Admin, (admin) => admin.code, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;

  @Column({ type: 'timestamp', name: "expires_at" })
  expiresAt: Date;
}
