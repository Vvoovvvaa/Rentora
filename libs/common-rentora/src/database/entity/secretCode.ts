import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany } from "typeorm";
import { Base } from "./base";
import { User } from "./user";

@Entity("secret_Code")
export class SecretCode extends Base{
    @Column({nullable: false})
    code:string

}