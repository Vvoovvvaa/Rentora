import { Column, Entity, ManyToOne } from 'typeorm';
import { Base } from './base';
import { PropertyCurrency } from '../../enums';
import { Property } from './property';

@Entity('price-hsitory')
export class PropertyPriceHistory extends Base {
  @Column({
    type: 'enum',
    enum: PropertyCurrency,
    default: PropertyCurrency.DOLLAR,
  })
  currency: PropertyCurrency;

  @Column()
  price: number;

  @ManyToOne(() => Property, (property) => property.price_history, {
    onDelete: 'CASCADE',
  })
  property: Property;
}
