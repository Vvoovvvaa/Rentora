import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';

import { userRoles } from '../enums';
import { Property } from '../database/entity';
import { AuthUserPayload } from '../interfaces';

type AuthRequest = Request & {
  user?: AuthUserPayload;
};

@Injectable()
export class OwnerCheckGuard implements CanActivate {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const rawPropertyId = request.params.propertyId ?? request.params.id;

    const propertyId = Number(rawPropertyId);

    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      throw new ForbiddenException('Invalid property id');
    }

    const property = await this.propertyRepo.findOne({
      where: {
        id: propertyId,
      },
      relations: {
        owner: true,
      },
    });

    if (!property) {
      throw new ForbiddenException('Property not found');
    }

    if (user.role === userRoles.ADMIN) {
      return true;
    }

    if (property.owner.id === user.id) {
      return true;
    }

    throw new ForbiddenException('You cannot access this resource');
  }
}
