import { Column, Entity, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { Base } from './base';
import { User } from './user';
import { Property } from './property';
import { AgencyImage } from './agency-image';

@Entity()
export class Agency extends Base {
  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  phone: string;

  @Column()
  description: string;

  @Column()
  email: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ default: false })
  verified: boolean;

  @ManyToOne(() => User, (user) => user.agency, { onDelete: 'CASCADE' })
  owner: User;

  @OneToMany(() => Property, (property) => property.agency)
  properties: Property[];

  @OneToOne(() => AgencyImage, (image) => image.agency, { onDelete: 'CASCADE' })
  image: AgencyImage;
}
