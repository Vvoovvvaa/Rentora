import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { Base } from './base';
import { adminRoleEnum } from '../../enums';
import { AdminSecretcode } from './admin-secret-code';
import { Support } from './support';

@Entity('admin')
export class Admin extends Base {
  @Column({ unique: true })
  gmail: string;

  @Column()
  password: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'enum', enum: adminRoleEnum, default: adminRoleEnum.admin, name: "admin_role" })
  adminRole: adminRoleEnum;

  @OneToOne(() => AdminSecretcode, (code) => code.admin, {
    onDelete: 'CASCADE',
  })
  code: AdminSecretcode;

  @OneToMany(() => Support, (support) => support.admin, { onDelete: 'CASCADE' })
  support: Support;
}
