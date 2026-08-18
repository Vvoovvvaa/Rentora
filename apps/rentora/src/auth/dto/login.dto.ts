import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  gmail: string;

  @IsString()
  password: string;
}
