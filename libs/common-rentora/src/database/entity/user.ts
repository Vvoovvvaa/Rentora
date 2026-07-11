import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import { Base } from "./base";
import { userRoles } from "../enums";
import { Usersecurity } from "./user-security";
import { accauntSatus } from "../enums/accaunt-status";
import { EmailStatusEnum } from "./email-status";
import { SecretCode } from "./secretCode";

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

    @Column({type: 'enum',enum: EmailStatusEnum,default: EmailStatusEnum.NOT_VERIFIED})
    gmailStatus: EmailStatusEnum

    @Column()
    password:string

    @Column({type: "enum",enum: userRoles,name: "user_role",default: userRoles.customer})
    userRole: userRoles
    
    @Column({type: 'enum', enum: accauntSatus, default: accauntSatus.ACTIVE})
    accauntStatus: accauntSatus
    
    @OneToOne(() => Usersecurity, security => security.user)
    security: Usersecurity

    @OneToOne(() => SecretCode, secretCode => secretCode.user)
    secretCode: SecretCode

}


