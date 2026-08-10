import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';

import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { AuthGuard } from '@app/common-rentora/guard';
import { AuthUser } from '@app/common-rentora/decorators';
import { changePropertyDto } from './dto/change-property.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateReportDto } from './dto/create-report.dto';


@Controller('properties')
export class PropertiesController {
    constructor(private readonly propertyservice: PropertiesService) { }

    @Post('create')
    @UseGuards(AuthGuard)
    @UseInterceptors(FilesInterceptor('photos', 10))
    createProperty(@Body() body: CreatePropertyDto, @AuthUser('id') userid: number, @UploadedFiles() files: Express.Multer.File[] = []) {
        return this.propertyservice.createProperty(userid, body, files)
    }

    @Patch(':id')
    @UseGuards(AuthGuard)
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
    @UseGuards(AuthGuard)
    viewMyproperty(@AuthUser('id') userId: number) {
        return this.propertyservice.myProperties(userId)
    }

    @Delete(':id')
    @UseGuards(AuthGuard)
    deleteProperty(@Param('id') propId: number, @AuthUser('id') userId: number) {
        return this.propertyservice.deleteProperty(userId, propId)
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
    @UseGuards(AuthGuard)
    archiveProperty(@AuthUser('id') userId: number, @Param('id') propId: number) {
        return this.propertyservice.achiveProperty(propId, userId)
    }

    @Post('comapre/:id1/:id2')
    @UseGuards(AuthGuard)
    propertyCompare(@AuthUser('id') userId: number, @Param('id1') propId1: number, @Param('id2') propId2: number){
        return this.propertyservice.compareProperties(userId,propId1,propId2)
    }

    @Post('report/:id')
    @UseGuards(AuthGuard)
    reportProperty(@Body() body: CreateReportDto,@AuthUser('id') userId:number, @Param('id') propId:number,  ){
        return this.propertyservice.createPropertyReport(body,userId,propId)
    }

    @Get("my-reports")
    @UseGuards(AuthGuard)
    viewMyReports(@AuthUser('id') userId: number){
        return this.propertyservice.viewMyreports(userId)
    }
}
