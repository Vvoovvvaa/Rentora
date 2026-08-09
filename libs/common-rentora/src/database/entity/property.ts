import {
    Column,
    Entity,
    ManyToOne,
    OneToMany
} from "typeorm";

import { Base } from "./base";
import {
    ArmeniaCity,
    PropertyCategory,
    PropertyStatus,
    PropertyFeature,
    PropertyCondition,
    BuildingType,
    propertyListing,
} from "../enums";

import { PropertyCurrency } from "../enums/property-currency";
import { User } from "./user";
import { PropertyImage } from "./property-image";
import { Favorites } from "./favorites";
import { Report } from "./report";

@Entity('property')
export class Property extends Base {
    @Column()
    title: string;

    @Column("text")
    description: string;

    @Column({
        type: 'enum',
        enum: PropertyStatus,
        default: PropertyStatus.ACTIVE
    })
    status: PropertyStatus;

    @Column({
        type: 'enum',
        enum: PropertyCategory
    })
    category: PropertyCategory;

    @Column({
        type: "decimal",
        precision: 12,
        scale: 2
    })
    price: number;

    @Column({
        type: 'enum',
        enum: PropertyCurrency
    })
    currency: PropertyCurrency;

    @Column({ default: 0 })
    views: number;

    @Column({
        type: "enum",
        enum: ArmeniaCity
    })
    city: ArmeniaCity;

    @Column({ default: 1 })
    rooms: number;

    @Column({ nullable: true })
    bedrooms: number;

    @Column({ nullable: true })
    bathrooms: number;

    @Column()
    area: number;

    @Column({ nullable: true })
    floor: number;

    @Column({ nullable: true })
    totalFloors: number;

    @Column({
        type: 'decimal',
        precision: 4,
        scale: 2,
        nullable: true
    })
    ceilingHeight: number;

    @Column({ nullable: true })
    constructionYear: number;

    @Column({
        type: 'enum',
        enum: PropertyCondition,
        nullable: true
    })
    condition: PropertyCondition;

    @Column({
        type: 'enum',
        enum: BuildingType,
        nullable: true
    })
    buildingType: BuildingType;

    @Column({
        type: 'enum',
        enum: PropertyFeature,
        enumName: 'property_feature_enum',
        array: true,
        default: '{}'
    })
    features: PropertyFeature[];

    @Column({type: 'enum', enum: propertyListing, nullable: true})
    listing?: propertyListing

    @ManyToOne(
        () => User,
        user => user.properties,
        {
            onDelete: 'CASCADE'
        }
    )
    owner: User;

    @OneToMany(
        () => PropertyImage,
        image => image.property,
        {
            cascade: true
        }
    )
    images: PropertyImage[];

    @OneToMany(
        () => Favorites,
        fav => fav.property
    )
    favorites: Favorites[];

    @OneToMany(() => Report, report => report.property, {onDelete: 'CASCADE'})
    report: Report
}
