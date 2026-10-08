import { Agency } from '@app/common-rentora';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AdminsAgencyService {
  constructor(
    @InjectRepository(Agency)
    private readonly agencyRepo: Repository<Agency>,
  ) {}

  async confirmVerifyAgency(agencyId: number) {
    const agency = await this.agencyRepo.findOne({
      where: { id: agencyId, verified: false },
      relations: { image: true },
    });

    if (!agency) {
      throw new NotFoundException('Agency Not found');
    }

    if (agency.verified === true) {
      throw new BadRequestException('Agency already verified');
    }

    agency.verified = true;
    await this.agencyRepo.save(agency);

    return { message: 'agency succesful verified' };
  }
}
