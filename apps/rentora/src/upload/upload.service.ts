import { CloudinaryDestroyResult } from '@app/common-rentora/interfaces';
import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Файл не передан');
    }

    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'rentora',
        },
        (error, result) => {
          if (error) {
            reject(new Error(error.message ?? 'Cloudinary upload failed'));
            return;
          }

          if (!result) {
            reject(new Error('Пустой ответ от Cloudinary'));
            return;
          }

          resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string): Promise<CloudinaryDestroyResult> {
    return cloudinary.uploader.destroy(publicId);
  }
}
