import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { Base } from "./base";
import { User } from "./user";

@Entity("secret_codes")
export class SecretCode extends Base{
    @Column({nullable: false})
    code:string

    @OneToOne(() => User,user => user.secretCode,{nullable:false})
    @JoinColumn({name: "user_id"})
    user:User

}