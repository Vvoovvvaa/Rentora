import { IsNotEmpty, IsString } from "class-validator";

export class ChangedPassword{
    @IsString()
    @IsNotEmpty()
    newPassword:string

    @IsNotEmpty()
    @IsString()
    code:string
}