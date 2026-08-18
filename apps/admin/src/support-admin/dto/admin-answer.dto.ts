import { IsNotEmpty, IsString } from 'class-validator';

export class adminAnswerDto {
  @IsNotEmpty()
  @IsString()
  message: string;
}
