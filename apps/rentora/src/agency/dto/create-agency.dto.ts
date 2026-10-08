import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateAgencyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsOptional()
  @IsUrl()
  website?: string;
}
