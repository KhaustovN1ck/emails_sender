import {Module} from '@nestjs/common';
import {MailerController} from './mailer.controller';
import {MailerService} from './mailer.service';
import {BullModule} from "@nestjs/bull";
import {MailerProcessor} from "./mailer.processor";
import * as process from "node:process";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Email} from "./entities/mail.entity";
import {Status} from "./entities/status.entity";

@Module({
    imports: [
        BullModule.forRoot({
            redis: {
                host: process.env.REDIS_HOST ?? 'redis',
                port: 6379,
            },
        }),
        BullModule.registerQueue({
            name: 'email',
        }),
        TypeOrmModule.forFeature([Email, Status])
    ],
    controllers: [MailerController],
    providers: [MailerService, MailerProcessor]
})
export class MailerModule {
}
