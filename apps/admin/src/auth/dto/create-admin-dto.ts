import { IsEmail, isEmail, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class CreateAdminDto{
    @IsNotEmpty()
    @IsString()
    name: string

    @IsEmail()
    @IsNotEmpty()
    gmail: string

    @IsStrongPassword()
    password: string
}