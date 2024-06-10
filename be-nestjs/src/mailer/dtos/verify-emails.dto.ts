import {ApiProperty} from "@nestjs/swagger";
import {ArrayNotEmpty, IsArray, IsEmail} from "class-validator";

export class VerifyEmailsDto {
    @ApiProperty({
        description: 'An array of valid email addresses',
        example: ['test@example.com', 'user@example.com'],
        type: [String],
    })
    @IsArray()
    @ArrayNotEmpty({message: 'The array of emails should not be empty'})
    @IsEmail({}, {each: true, message: 'Each value in the array must be a valid email address'})
    emails: string[];
}