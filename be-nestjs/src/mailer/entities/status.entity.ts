import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Email } from './mail.entity';
import { Status as StatusName } from '../enum/status';

@Entity()
export class Status {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({default: StatusName.Validating, unique: true})
    name: StatusName;

    @OneToMany(() => Email, email => email.status)
    emails: Email[];
}
