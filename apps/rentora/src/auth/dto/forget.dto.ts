import { IsEmail, IsNotEmpty } from 'class-validator';

export class forgetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  gmail: string;
}
