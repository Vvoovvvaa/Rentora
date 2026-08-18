import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  gmail: string;
}
