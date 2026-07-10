import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import { Base } from "./base";
import { userRoles } from "../enums";
import { Usersecurity } from "./user-security";
import { accauntSatus } from "../enums/accaunt-status";

@Entity("users")
export class User extends Base{
    @Column()
    name:string

    @Column({unique:true})
    phone: string

    @Column()
    age:number

    @Column()
    gmail: string

    @Column()
    password:string

    @Column({type: "enum",enum: userRoles,name: "user_role",default: userRoles.customer})
    userRole: userRoles

    @OneToOne(() => Usersecurity, security => security.user)
    security: Usersecurity

    @Column({type: 'enum', enum: accauntSatus, default: accauntSatus.ACTIVE})
    accauntStatus: accauntSatus
}


