import { registerAs } from '@nestjs/config';
import { ICLoudinaryConfig } from '../models';

export const cloudinaryConfig = registerAs(
  'CLODUINARYCONFIG',
  (): ICLoudinaryConfig => {
    return {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
    };
  },
);
