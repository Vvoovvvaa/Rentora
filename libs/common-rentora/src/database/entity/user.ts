import { Column, Entity, JoinColumn, OneToMany } from "typeorm";
import { Base } from "./base";
import { userRoles } from "../enums";

@Entity("users")
export class User extends Base{
    @Column()
    name:string

    @Column()
    phone: string

    @Column()
    age:number

    @Column()
    gmail: string

    @Column()
    password:string

    @Column({type: "enum",enum: userRoles,name: "user_role",default: userRoles.ghost})
    userRole: userRoles
}


