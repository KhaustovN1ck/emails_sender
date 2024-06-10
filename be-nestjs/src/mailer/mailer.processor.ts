import {Process, Processor} from "@nestjs/bull";
import {EventEmitter2} from '@nestjs/event-emitter';
import {Job} from "bull";
import {Status as StatusEnum} from './enum/status';
import {InjectRepository} from '@nestjs/typeorm';
import {Email} from "./entities/mail.entity";
import {Repository} from "typeorm";
import {Status} from "./entities/status.entity";

const MIN_DELAY = 5000;
const MAX_DELAY = 100000;

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

    private getRandomDelay(minSeconds: number, maxSeconds: number) {
        const minMilliseconds = minSeconds * 1000;
        const maxMilliseconds = maxSeconds * 1000;
        return Math.floor(Math.random() * (maxMilliseconds - minMilliseconds + 1)) + minMilliseconds;
    }

    @Process({concurrency: 10})
    async handleEmail(job: Job<Email>) {
        const delay = this.getRandomDelay(5, 100);
        const status = await new Promise((resolve) => setTimeout(() => {
            if (Math.random() > 0.5) {
                resolve(StatusEnum.Valid);
            }
            resolve(StatusEnum.Invalid);
        }, delay));

        const data: Email = {
            ...job.data,
            lastUpdatedAt: new Date(),
            status: await this.statusRepository.findOne({
                where: {
                    name: status as StatusEnum,
                }
            })
        }

        // if by the time promise resolved, the record already does not exist in the DB
        // consider the job was stopped from outside
        if(!(await this.emailRepository.exists({where: {id: data.id}}))) {
            await job.remove();
            return;
        }


        await this.emailRepository.save(data);
        this.eventEmitter.emit('email.processed', data);
        return `Processed email: ${job.data.email}`;
    }
}