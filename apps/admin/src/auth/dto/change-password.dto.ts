import { IsNotEmpty, isNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class changeAdminPasswordDto{
    @IsNotEmpty()
    @IsString()
    oldPassword: string

    @IsNotEmpty()
    @IsStrongPassword()
    newPassword: string
}