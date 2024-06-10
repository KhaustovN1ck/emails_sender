import {BadRequestException, Body, Controller, Get, Post, Res, Sse} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {VerifyEmailsDto} from "./dtos/verify-emails.dto";
import {Observable, Subject} from "rxjs";
import {EventEmitter2, OnEvent} from "@nestjs/event-emitter";
import {MailerService} from "./mailer.service";
import {Response} from 'express';
import {Email} from "./entities/mail.entity";


@ApiTags('mailer')
@Controller('mailer')
export class MailerController {

    private emailSubject: Subject<MessageEvent> = new Subject();

    constructor(private readonly mailerService: MailerService, private eventEmitter: EventEmitter2) {
    }

    @Get()
    async getAllEmails() {
        return this.mailerService.getAll();
    }

    // used for test purposes to simplify testing
    @Post('reset-all')
    async reset() {
        return this.mailerService.resetAll();
    }

    @Post('verify')
    newMessages(
        @Body() verifyEmailsDto: VerifyEmailsDto,
    ) {
        try {
            return this.mailerService.addEmailsToQueue(verifyEmailsDto.emails);
        } catch (err) {
            throw new BadRequestException(err);
        }
    }

    @Sse('status')
    sse(@Res() res: Response): Observable<MessageEvent> {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*'); // TODO! remove wildcard
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        return this.emailSubject.asObservable();
    }

    @OnEvent('email.processed')
    handleEmailProcessedEvent(payload: Email) {
        const messageEvent = new MessageEvent('message', {
            data: payload,
        });
        this.emailSubject.next(messageEvent);
    }
}
