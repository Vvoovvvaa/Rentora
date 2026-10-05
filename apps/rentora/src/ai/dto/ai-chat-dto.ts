import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AiChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message: string;

  @IsOptional()
  @IsString()
  previousResponseId?: string;
}
