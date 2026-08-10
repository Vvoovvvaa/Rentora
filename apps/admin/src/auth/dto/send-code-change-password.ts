import { IsEmail, IsNotEmpty } from "class-validator";

export class SendCodeChangePasswordDto{
    @IsNotEmpty()
    @IsEmail()
    gmail: string
}