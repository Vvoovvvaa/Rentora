import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchDto } from './dto/search.dto';
import { AuthGuard } from '@app/common-rentora/guard';

@Controller('search')
@UseGuards(AuthGuard)
export class SearchController {
    constructor(private readonly searchService: SearchService){}

    @Get()
    searchProperties(@Query() dto: SearchDto){
        return this.searchService.searchProperties(dto)
    }
}
