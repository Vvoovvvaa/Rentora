import { Column, Entity, OneToOne } from "typeorm";
import { Base } from "./base";
import { adminRoleEnum } from "../enums";
import { AdminSecretcode } from "./adminSecretCode";

@Entity('admin')
export class Admin extends Base{
    @Column({unique: true})
    gmail: string

    @Column()
    password: string

    @Column({unique: true})
    name: string

    @Column({type: 'enum', enum: adminRoleEnum, default: adminRoleEnum.admin})
    adminRole: adminRoleEnum

    @OneToOne(() => AdminSecretcode, code => code.admin, {onDelete: 'CASCADE'})
    code: AdminSecretcode

}