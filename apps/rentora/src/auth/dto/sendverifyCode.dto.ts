import { IsEmail } from 'class-validator';

export class sendVerifyCodeDto {
  @IsEmail()
  email: string;
}
