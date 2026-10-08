import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Base } from './base';
import { Agency } from './agency';

@Entity()
export class AgencyImage extends Base {
  @Column()
  url: string;

  @Column()
  size: number;

  @Column({ name: 'public_id' })
  publicId: string;

  @OneToOne(() => Agency, (agency) => agency.image, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'agency_image' })
  agency: Agency;
}
