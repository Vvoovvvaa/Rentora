import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryProvider } from './cloudinary.client';

@Module({
  imports: [ConfigModule],
  providers: [UploadService, CloudinaryProvider],
  exports: [UploadService],
})
export class UploadModule {}
