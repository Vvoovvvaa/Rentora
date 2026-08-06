import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';

import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { AuthGuard, OwnerCheckGuard } from '@app/common-rentora/guard';
import { AuthUser } from '@app/common-rentora/decorators';
import { changePropertyDto } from './dto/change-property.dto';
import { FilesInterceptor } from '@nestjs/platform-express';


@UseGuards(AuthGuard)
@Controller('properties')
export class PropertiesController {
    constructor(private readonly propertyservice: PropertiesService) { }

    @Post('create')
    @UseInterceptors(FilesInterceptor('photos', 10))
    createProperty(@Body() body: CreatePropertyDto, @AuthUser('id') userid: number, @UploadedFiles() files: Express.Multer.File[]) {
        return this.propertyservice.createProperty(userid, body, files)
    }

    @Patch(':id')
    @UseGuards(OwnerCheckGuard)
    updateProperty(
        @Param('id') propId: number,
        @Body() body: changePropertyDto,
        @AuthUser('id') userId: number,
    ) {
        return this.propertyservice.changeProperty(
            userId,
            propId,
            body
        )
    }

    @Get('my')
    viewMyproperty(@AuthUser('id') userId: number) {
        return this.propertyservice.myProperties(userId)
    }

    @Delete(':id')
    @UseGuards(OwnerCheckGuard)
    deleteProperty(@Param('id') propId: number, @AuthUser('id') userId: number) {
        return this.propertyservice.deleteProperty(propId, userId)
    }

    @Post('find/:id')
    findeProperty(@Param('id') propId: number) {
        return this.propertyservice.findProperty(propId)
    }

    @Get()
    allProperties() {
        return this.propertyservice.allProperties()
    }

    @Post('archive/:id')
    archiveProperty(@AuthUser('id') userId: number, @Param('id') propId: number) {
        return this.propertyservice.achiveProperty(propId, userId)
    }
}
