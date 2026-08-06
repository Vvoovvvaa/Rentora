import { Entity, JoinColumn, ManyToOne } from "typeorm";
import { Base } from "./base";
import { User } from "./user";
import { Property } from "./property";

@Entity('favorites')
export class Favorites extends Base{
    @ManyToOne(() => User, user => user.favorites)
    @JoinColumn()
    user: User

    @ManyToOne(() => Property, property => property.favorites)
    @JoinColumn()
    property: Property
}