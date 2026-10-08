import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateAgencyDto } from './dto/create-agency.dto';
import { UploadService } from '../upload/upload.service';
import { Agency } from '@app/common-rentora';
import { AgencyImage, PhotoValidator } from '@app/common-rentora';
import { ChangeAgencyDto } from './dto/change-agency.dto';

@Injectable()
export class AgencyService {
  constructor(
    @InjectRepository(Agency)
    private readonly agencyRepo: Repository<Agency>,

    @InjectRepository(AgencyImage)
    private readonly agencyImageRepo: Repository<AgencyImage>,

    private readonly uploadservice: UploadService,
  ) {}

  async createAgency(
    dto: CreateAgencyDto,
    userId: number,
    file?: Express.Multer.File,
  ) {
    const existingAgency = await this.agencyRepo.findOne({
      where: { owner: { id: userId } },
    });

    if (existingAgency) {
      throw new BadRequestException('You already have an agency');
    }

    const agency = this.agencyRepo.create({
      ...this.getAllowedAgencyFields(dto),
      owner: { id: userId },
    });

    const savedAgency = await this.agencyRepo.save(agency);

    if (file) {
      PhotoValidator.validator(file);

      const upload = await this.uploadservice.uploadImage(file);

      const image = this.agencyImageRepo.create({
        url: upload.secure_url,
        publicId: upload.public_id,
        size: file.size,
        agency: savedAgency,
      });

      await this.agencyImageRepo.save(image);
    }

    return { message: 'Agency successfully created' };
  }
  async changeAgency(
    dto: ChangeAgencyDto,
    userId: number,
    file?: Express.Multer.File,
  ) {
    const existingAgency = await this.agencyRepo.findOne({
      where: {
        owner: {
          id: userId,
        },
      },
      relations: {
        image: true,
      },
    });

    if (!existingAgency) {
      throw new NotFoundException('Agency not found');
    }

    Object.assign(existingAgency, this.getAllowedAgencyFields(dto));

    if (file) {
      PhotoValidator.validator(file);

      const uploaded = await this.uploadservice.uploadImage(file);

      if (existingAgency.image) {
        const oldPublicId = existingAgency.image.publicId;

        existingAgency.image.url = uploaded.secure_url;
        existingAgency.image.publicId = uploaded.public_id;
        existingAgency.image.size = file.size;

        await this.agencyImageRepo.save(existingAgency.image);

        if (oldPublicId && oldPublicId !== uploaded.public_id) {
          try {
            await this.uploadservice.deleteImage(oldPublicId);
          } catch {
            // The new logo is already stored. A failed remote cleanup must not
            // roll back a valid agency update.
          }
        }
      } else {
        const image = this.agencyImageRepo.create({
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          size: file.size,
          agency: existingAgency,
        });

        await this.agencyImageRepo.save(image);
      }
    }

    await this.agencyRepo.save(existingAgency);

    return {
      message: 'Agency successfully updated',
    };
  }

  async getAllAgencies() {
    return this.agencyRepo.find({
      where: {
        verified: true,
      },
      relations: {
        image: true,
      },
    });
  }

  async getOneAgency(agencyId: number) {
    const agency = await this.agencyRepo.findOne({
      where: { id: agencyId, verified: true },
      relations: { image: true },
    });

    if (!agency) {
      throw new NotFoundException('Agency Not Found');
    }

    return agency;
  }

  async deleteAgency(agencyId: number, userId: number) {
    const existingAgency = await this.agencyRepo.findOne({
      where: { id: agencyId, owner: { id: userId } },
      relations: { image: true },
    });

    if (!existingAgency) {
      throw new NotFoundException('Agency Not Found');
    }

    if (existingAgency.image) {
      await this.uploadservice.deleteImage(existingAgency.image.publicId);
      await this.agencyImageRepo.remove(existingAgency.image);
    }

    await this.agencyRepo.remove(existingAgency);
    return { message: 'Agency successfully deleted' };
  }

  async getMyAgency(userId: number) {
    const agency = await this.agencyRepo.findOne({
      where: { owner: { id: userId } },
      relations: { image: true },
    });

    if (!agency) {
      throw new NotFoundException('You dont have agency');
    }

    return agency;
  }

  private getAllowedAgencyFields(dto: CreateAgencyDto | ChangeAgencyDto) {
    return {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.address !== undefined ? { address: dto.address } : {}),
      ...(dto.website !== undefined ? { website: dto.website } : {}),
    };
  }
}
