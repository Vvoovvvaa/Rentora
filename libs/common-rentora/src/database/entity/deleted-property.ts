import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToOne,
} from 'typeorm';

import { Admin } from './admin';
import { PropertyDeleteReasonEnum } from '@app/common-rentora/enums';
import { Base } from './base';

@Entity('property-deletion-log')
export class PropertyDeletionLog extends Base {
    @Column({
        type: 'enum',
        enum: PropertyDeleteReasonEnum,
        enumName: 'property_delete_reason_enum',
    })
    reason: PropertyDeleteReasonEnum;

    @Column({ type: 'int' })
    propertyId: number;

    @ManyToOne(() => Admin, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'admin_id' })
    admin: Admin | null;
}