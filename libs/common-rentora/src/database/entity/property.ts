import { Column, Entity, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { Base } from "./base";
import { ArmeniaCity, PropertyCategory, PropertyStatus } from "../enums";
import { PropertyCurrency } from "../enums/property-currency";
import { User } from "./user";
import { PropertyImage } from "./property-image";

@Entity('property')
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

    @Column({default: 0})
    views: number

    @Column({type: "enum", enum: ArmeniaCity})
    city: ArmeniaCity

    @ManyToOne(() => User, user => user.properties, {
        onDelete: 'CASCADE',
    })
    owner: User;

    @OneToMany(() => PropertyImage,images => images.property, {cascade:true})
    images: PropertyImage[]

}