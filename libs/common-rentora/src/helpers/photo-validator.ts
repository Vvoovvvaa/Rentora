import { BadRequestException } from "@nestjs/common";

export class PhotoValidator {
    static validator(file: Express.Multer.File) {
        const MAX_SIZE = 5 * 1024 * 1024;
        const ALLOWED_TYPES = ['image/jpeg', 'image/jpg',];

        if (file.size > MAX_SIZE) {
            throw new BadRequestException(`file - ${file.originalname},maximum file size 5MB`);
        }

        if (!ALLOWED_TYPES.includes(file.mimetype)) {
            throw new BadRequestException(`file - ${file.originalname}, please entry jpeg or jpg formate`);
        }

        return file
    }
}