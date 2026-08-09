import { Column, Entity, ManyToOne } from "typeorm";
import { Base } from "./base";
import { ReportStatusEnum } from "../enums";
import { User } from "./user";
import { Property } from "./property";

@Entity('reports')
export class Report extends Base {
    @Column({ type: 'enum', enum: ReportStatusEnum })
    reason: ReportStatusEnum

    @Column()
    description: string


    @ManyToOne(() => User, user => user.report, { onDelete: 'CASCADE' })
    user: User

    @ManyToOne(() => Property, prop => prop.report, { onDelete: 'CASCADE' })
    property: Property
}