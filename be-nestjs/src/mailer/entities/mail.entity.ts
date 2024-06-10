import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Status} from "./status.entity";

@Entity()
export class Email {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column({unique: true})
    email: string;

    @Column({type: 'datetime'})
    lastUpdatedAt: Date;

    @ManyToOne(() => Status, status => status.emails)
    status: Status;
}
