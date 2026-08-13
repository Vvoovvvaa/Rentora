import { IsNumber, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SearchDto } from '../../search/dto/search.dto';

export class PropertyMapDto extends SearchDto {

    @Type(() => Number)
    @IsNumber()
    @Min(-90)
    @Max(90)
    north: number;

    @Type(() => Number)
    @IsNumber()
    @Min(-90)
    @Max(90)
    south: number;

    @Type(() => Number)
    @IsNumber()
    @Min(-180)
    @Max(180)
    east: number;

    @Type(() => Number)
    @IsNumber()
    @Min(-180)
    @Max(180)
    west: number;
}
