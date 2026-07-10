import { IsEmail, IsNotEmpty, IsNumber, IsPhoneNumber, IsString, IsStrongPassword, Max, MaxLength, Min, MinLength } from "class-validator"
import { StringifyOptions } from "querystring"

export class CreateAuthDto {
    @IsString()
    @MinLength(3)
    @MaxLength(15)
    @IsNotEmpty()
    name: string

    @IsPhoneNumber()
    @IsNotEmpty()
    phone: string

    @IsNumber()
    @Min(18)
    @Max(99)
    @IsNotEmpty()
    age: number


    @IsEmail()
    @IsNotEmpty()
    gmail: string

    @IsStrongPassword()
    @IsNotEmpty()
    password: string
}