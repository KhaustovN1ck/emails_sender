import {Module} from '@nestjs/common';
import {MailerModule} from './mailer/mailer.module';
import {EventEmitterModule} from '@nestjs/event-emitter';
import {TypeOrmModule} from "@nestjs/typeorm";

console.log(process.env.MYSQL_USER, process.env.MYSQL_ROOT_PASSWORD, process.env.MYSQL_DATABASE)

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'mysql',
            host: process.env.DATABASE_HOST, // using docker container name
            port: 3306,
            username: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            autoLoadEntities: true,
            synchronize: true, // FIXME! just for development purposes and simplicity :)
        }),
        MailerModule,
        EventEmitterModule.forRoot()
    ],
})
export class AppModule {
}
