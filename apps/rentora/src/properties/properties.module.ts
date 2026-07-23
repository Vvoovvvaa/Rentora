import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property, User } from '@app/common-rentora/database/entity';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService],
  imports: [
    TypeOrmModule.forFeature([User,Property])
  ]
})
export class PropertiesModule {}
