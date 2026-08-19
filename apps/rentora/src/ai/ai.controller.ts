import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiChatDto } from './dto/ai-chat-dto';
import { AuthGuard } from '@app/common-rentora/guard';

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  chat(@Body() body: AiChatDto) {
    return this.aiService.chat(body);
  }
}