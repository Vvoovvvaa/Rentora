import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";

import { Base } from "./base";
import { Property } from "./property";

@Entity('Analytic')
export class PropertyAnalytic extends Base {

    @Column({ type: 'date' })
    date: string

    @Column({ default: 0 })
    favoritesAdded: number;

    @Column({ default: 0 })
    chatsStarted: number;

    @ManyToOne(() => Property, property => property.analytic, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'propertyId' })
    property: Property

}