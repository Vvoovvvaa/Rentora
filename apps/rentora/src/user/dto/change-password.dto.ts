import { IsNotEmpty, IsString, IsStrongPassword, isStrongPassword } from "class-validator";

export class changePasswordDto {

    @IsNotEmpty()
    Oldpassword: string

    @IsStrongPassword()
    @IsNotEmpty()
    NewPassword: string
}