import {Process, Processor} from "@nestjs/bull";
import {EventEmitter2} from '@nestjs/event-emitter';
import {Job} from "bull";
import {Status as StatusEnum} from './enum/status';
import {InjectRepository} from '@nestjs/typeorm';
import {Email} from "./entities/mail.entity";
import {Repository} from "typeorm";
import {Status} from "./entities/status.entity";

const MIN_DELAY = 1000;
const MAX_DELAY = 10000;

@Processor('email')
export class MailerProcessor {
    constructor(
        private eventEmitter: EventEmitter2,
        @InjectRepository(Email)
        private readonly emailRepository: Repository<Email>,
        @InjectRepository(Status)
        private readonly statusRepository: Repository<Status>,
    ) {
    }

    @Process({concurrency: 10})
    async handleEmail(job: Job<Email>) {
        const delay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
        const status = await new Promise((resolve) => setTimeout(() => {
            if (Math.random() > 0.5) {
                resolve(StatusEnum.Valid);
            }
            resolve(StatusEnum.Invalid);
        }, delay));

        const data = {
            ...job.data,
            status: await this.statusRepository.findOne({
                where: {
                    name: status as StatusEnum,
                }
            })
        }

        await this.emailRepository.save(data);
        this.eventEmitter.emit('email.processed', data);
        return `Processed email: ${job.data.email}`;
    }
}