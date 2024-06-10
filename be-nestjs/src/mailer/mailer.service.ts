import {BadRequestException, Injectable, OnModuleDestroy} from '@nestjs/common';
import {InjectQueue} from '@nestjs/bull';
import {Queue} from 'bull';
import {InjectRepository} from "@nestjs/typeorm";
import {Email} from "./entities/mail.entity";
import {DataSource, Repository} from "typeorm";
import {Status} from "./entities/status.entity";
import {Status as StatusEnum} from "./enum/status";

@Injectable()
export class MailerService implements OnModuleDestroy {
    constructor(
        @InjectQueue('email') private emailQueue: Queue,
        @InjectRepository(Email)
        private readonly emailRepository: Repository<Email>,
        @InjectRepository(Status)
        private readonly statusRepository: Repository<Status>,
        private dataSource: DataSource,
    ) {
    }

    async onModuleDestroy() {
        await this.emailQueue.close(true);
    }

    private getValidatingStatus() {
        return this.statusRepository.findOne({
            where: {
                name: StatusEnum.Validating
            }
        });
    }

    // FIXME! In theory, this is a bad practice, just a short hack to avoid creating seeding modules
    private async seedDbWithStatuses() {
        const keys = Object.keys(StatusEnum);
        return Promise.all(keys.map(k => {
            const statusRecord = new Status();
            statusRecord.name = k as StatusEnum;
            return this.statusRepository.save(statusRecord);
        }));
    }

    async addEmailsToQueue(emails: string[]) {
        let validatingStatus: Status;
        validatingStatus = await this.getValidatingStatus();
        if (!validatingStatus) {
            await this.seedDbWithStatuses();
        }
        validatingStatus = await this.getValidatingStatus();
        const emailRecords = await this.dataSource.transaction(async manager => {
            return await Promise.all(emails.map(async e => {

                const email = new Email();
                email.email = e;
                email.status = validatingStatus;
                email.lastUpdatedAt = new Date();
                const alreadyExists = await manager.exists<Email>(Email, {
                    where: {
                        email: email.email,
                    }
                })
                if(alreadyExists) {
                    throw new BadRequestException("This email already exists. Reset the table first")
                }
                return await manager.save(email);
            }))
        })
        emailRecords.map(async email => await this.emailQueue.add(email));
        return emailRecords;
    }

    async resetAll() {
        await this.emailQueue.pause(true, true);
        await this.emailQueue.empty();
        const activeJobs = await this.emailQueue.getActive();
        try {
            for(const job of activeJobs) {
                await job.remove();
            }
        } catch (err) {
            console.log(`error happened during removing job. ${err}`)
        }
        await this.emailRepository.clear();
        await this.emailQueue.resume(true);
    }

    async getAll() {
       return this.emailRepository.find({relations: ['status']})
    }
}