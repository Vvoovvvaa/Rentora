import { IsNotEmpty, IsNumber, IsStrongPassword } from "class-validator";

export class NewPassowrdDto {
    @IsNumber()
    @IsNotEmpty()
    code: string

    @IsStrongPassword()
    @IsNotEmpty()
    newPassword: string
}