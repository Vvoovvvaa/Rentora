import { Column, Entity, ManyToOne, OneToOne } from "typeorm";
import { Base } from "./base";
import { PropertyCategory, PropertyStatus } from "../enums";
import { PropertyCurrency } from "../enums/property-currency";
import { User } from "./user";

@Entity('Property')
export class Property extends Base {
    @Column()
    title: string

    @Column("text")
    description: string

    @Column({ type: 'enum', enum: PropertyStatus, default: PropertyStatus.ACTIVE })
    status: PropertyStatus

    @Column({ type: 'enum', enum: PropertyCategory })
    category: PropertyCategory

    @Column({
        type: "decimal",
        precision: 12,
        scale: 2,
    })
    price: number;

    @Column({ type: 'enum', enum: PropertyCurrency })
    currency: PropertyCurrency

    @ManyToOne(() => User, user => user.properties, {
        onDelete: 'CASCADE',
    })
    owner: User;


}