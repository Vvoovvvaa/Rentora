import { Column, Entity, ManyToOne } from "typeorm";
import { Base } from "./base"
import { SupportStatusEnum } from "../enums/support-status";
import { supportTicketEnum } from "../enums";
import { User } from "./user";
import { Admin } from "./admin";


@Entity('Support')
export class Support extends Base {

    @Column({ type: 'enum', enum: SupportStatusEnum, default: SupportStatusEnum.WAITING_ADMIN })
    status: SupportStatusEnum

    @Column({ type: 'enum', enum: supportTicketEnum })
    ticket: supportTicketEnum

    @Column()
    subject: string

    @Column()
    message: string

    @Column({nullable: true})
    adminRespone?: string

    @ManyToOne(() => User, user => user.support, { onDelete: 'CASCADE' })
    user: User

    @ManyToOne(() => Admin, admin => admin.support, { onDelete: 'CASCADE', nullable: true })
    admin: Admin | null
}