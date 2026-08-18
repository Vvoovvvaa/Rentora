import { IsNotEmpty, IsStrongPassword } from 'class-validator';

export class changePasswordDto {
  @IsNotEmpty()
  Oldpassword: string;

  @IsStrongPassword()
  @IsNotEmpty()
  NewPassword: string;
}
