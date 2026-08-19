import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { SearchModule } from '../search/search.module';

@Module({
  providers: [AiService],
  controllers: [AiController],
  imports: [SearchModule]
})
export class AiModule {}
