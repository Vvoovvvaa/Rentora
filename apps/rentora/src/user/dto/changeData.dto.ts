import { IsNumber, IsOptional, IsPhoneNumber, IsString } from "class-validator"

export class changeUserdataDto{
    @IsString()
    @IsOptional()
    name?: string

    @IsNumber()
    @IsOptional()
    age?: number

    @IsPhoneNumber()
    @IsOptional()
    phone?: string

}