import { Agency } from '@app/common-rentora';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import { RejectAgencyDto } from './dto/agency-reject.dto';
import { deleteagencyDto } from './dto/delete-agency.dto';

@Injectable()
export class AdminsAgencyService {
  constructor(
    @InjectRepository(Agency)
    private readonly agencyRepo: Repository<Agency>,
  ) {}

  async confirmVerifyAgency(agencyId: number) {
    const agency = await this.agencyRepo.findOne({
      where: { id: agencyId },
    });

    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    if (agency.verified) {
      throw new BadRequestException(
        'Agency is already verified',
      );
    }

    agency.verified = true;
    agency.verificationRejectionReason = null;

    await this.agencyRepo.save(agency);

    return {
      message: 'Agency verified successfully',
      agencyId: agency.id,
      verified: agency.verified,
    };
  }

  async RejectAgencyVerify(
    agencyId: number,
    dto: RejectAgencyDto,
  ) {
    const agency = await this.agencyRepo.findOne({
      where: { id: agencyId },
    });

    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    if (agency.verified) {
      throw new BadRequestException(
        'Cannot reject an already verified agency',
      );
    }

    const reason = dto.reason?.trim();

    if (!reason) {
      throw new BadRequestException(
        'Rejection reason is required',
      );
    }

    agency.verificationRejectionReason = reason;

    await this.agencyRepo.save(agency);

    return {
      message: 'Agency verification rejected',
      agencyId: agency.id,
      reason: agency.verificationRejectionReason,
    };
  }

  async getAllPendingAgency() {
    return this.agencyRepo.find({
      where: {
        verified: false,
        verificationRejectionReason: IsNull(),
      },
      relations: {
        image: true,
        owner: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async getAllVerfiedAgency() {
    return this.agencyRepo.find({
      where: {
        verified: true,
      },
      relations: {
        image: true,
        owner: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getAllRejectedAgency() {
    return this.agencyRepo.find({
      where: {
        verified: false,
        verificationRejectionReason: Not(IsNull()),
      },
      relations: {
        image: true,
        owner: true,
      },
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  async deleteAgency(
    agencyId: number,
    dto: deleteagencyDto,
  ) {
    const agency = await this.agencyRepo.findOne({
      where: {
        id: agencyId,
        verified: true,
      },
    });

    if (!agency) {
      throw new NotFoundException(
        'Verified agency not found',
      );
    }

    const deleteReason = dto.deleteReason?.trim();

    if (!deleteReason) {
      throw new BadRequestException(
        'Deletion reason is required',
      );
    }

    await this.agencyRepo.remove(agency);

    return {
      message: 'Agency deleted successfully',
      agencyId,
      deleteReason,
    };
  }
}