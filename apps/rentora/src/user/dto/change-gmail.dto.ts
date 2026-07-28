import { IsEmail, IsNotEmpty } from "class-validator";

export class ChangeGmailDto{
    @IsNotEmpty()
    @IsEmail()
    gmail:string
}