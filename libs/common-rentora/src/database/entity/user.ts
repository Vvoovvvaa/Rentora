import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import { Base } from "./base";
import { userRoles } from "../enums";
import { UserSecurity } from "./user-security";
import { accauntSatus } from "../enums/accaunt-status";
import { EmailStatusEnum } from "../enums/email-status";
import { SecretCode } from "./secretCode";
import { Property } from "./property";
import { UserImage } from "./user-images";
import { Favorites } from "./favorites";
import { Report } from "./report";

@Entity("users")
export class User extends Base {
    @Column()
    name: string

    @Column({ unique: true })
    phone: string

    @Column()
    age: number

    @Column()
    gmail: string

    @Column({ type: 'enum', enum: EmailStatusEnum, default: EmailStatusEnum.NOT_VERIFIED })
    gmailStatus: EmailStatusEnum

    @Column()
    password: string

    @Column({ type: "enum", enum: userRoles, name: "user_role", default: userRoles.USER })
    userRole: userRoles

    @Column({ type: 'enum', enum: accauntSatus, default: accauntSatus.ACTIVE })
    accauntStatus: accauntSatus

    @OneToOne(() => UserSecurity, security => security.user)
    security: UserSecurity

    @OneToOne(() => SecretCode, secretCode => secretCode.user)
    secretCode: SecretCode

    @OneToMany(() => Property, property => property.owner)
    properties: Property[];

    @OneToOne(() => UserImage,image => image.user,{onDelete: 'CASCADE', nullable:true, cascade: true})
    @JoinColumn()
    image: UserImage

    @OneToMany(() => Favorites, fav => fav.user)
    favorites: Favorites[]

    @OneToMany(() => Report, report => report.user)
    report: Report

}


