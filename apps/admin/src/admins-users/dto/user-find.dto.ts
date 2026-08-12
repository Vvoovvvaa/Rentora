import { IsEmail, IsOptional, IsPhoneNumber, IsString } from "class-validator";

export class findUserDto{
    @IsEmail()
    @IsOptional()
    gmail?: string

    @IsPhoneNumber()
    @IsOptional()
    phone?: string

    @IsString()
    @IsOptional()
    name?:string
}