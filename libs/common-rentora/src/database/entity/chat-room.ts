import { Entity, Column } from "typeorm";
import { Base } from "./base";


@Entity('chat_room')
export class ChatRoom extends Base {

    @Column()
    propertyId:number;

    @Column()
    ownerId:number;

    @Column()
    clientId:number;

}