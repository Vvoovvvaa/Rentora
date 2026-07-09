import { IsEmail, IsNumber, IsPhoneNumber, IsString, IsStrongPassword, Max, MaxLength, Min, MinLength } from "class-validator"
import { StringifyOptions } from "querystring"

export class CreateAuthDto {
    @IsString()
    @MinLength(3)
    @MaxLength(15)
    name: string

    @IsPhoneNumber()
    phone: string

    @IsNumber()
    @Min(18)
    @Max(99)
    age: number


    @IsEmail()
    gmail: string

    @IsStrongPassword()
    password: string
}