import { Property } from '@app/common-rentora/database/entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
    imports: [TypeOrmModule.forFeature([Property])],
    controllers: [SearchController],
    providers: [SearchService],
    exports: [SearchService]
})
export class SearchModule {}
