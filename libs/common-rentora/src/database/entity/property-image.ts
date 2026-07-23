import { Column, Entity, ManyToMany, ManyToOne } from "typeorm";
import { Base } from "./base";
import { Property } from "./property";

@Entity()
export class PropertyImage extends Base {
    @Column()
    url: string

    @Column()
    size: number

    @Column()
    publicId: string;


    @ManyToOne(() => Property, property => property.images, { onDelete: 'CASCADE' })
    property: Property
}