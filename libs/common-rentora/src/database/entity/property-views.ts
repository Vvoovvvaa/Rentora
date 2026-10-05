import { Entity, ManyToOne } from 'typeorm';
import { Base } from './base';
import { Property } from './property';
import { User } from './user';

@Entity('property-views')
export class PropertyViews extends Base {
  @ManyToOne(() => Property, (prop) => prop.views, { onDelete: 'CASCADE' })
  property: Property;

  @ManyToOne(() => User, (user) => user.views, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  user: User;
}
