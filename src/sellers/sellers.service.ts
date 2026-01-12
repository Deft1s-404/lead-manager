import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Seller } from '@prisma/client';

import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { PaginatedSellers, SellersRepository } from './sellers.repository';

@Injectable()
export class SellersService {
  constructor(private readonly sellersRepository: SellersRepository) {}

  list(userId: string, query: PaginationQueryDto): Promise<PaginatedSellers> {
    return this.sellersRepository.findMany(userId, query);
  }

  async findById(userId: string, id: string): Promise<Seller> {
    const seller = await this.sellersRepository.findById(userId, id);

    if (!seller) {
      throw new NotFoundException('Vendedor nao encontrado');
    }

    return seller;
  }

  create(userId: string, dto: CreateSellerDto): Promise<Seller> {
    const data: Omit<Prisma.SellerUncheckedCreateInput, 'userId'> = {
      name: dto.name,
      email: dto.email ?? undefined,
      contactNumber: dto.contactNumber ?? undefined,
      availabilityStartDay:
        dto.availabilityStartDay !== undefined ? dto.availabilityStartDay : undefined,
      availabilityEndDay: dto.availabilityEndDay !== undefined ? dto.availabilityEndDay : undefined,
      availabilityStartTime:
        dto.availabilityStartTime !== undefined ? dto.availabilityStartTime : undefined,
      availabilityEndTime: dto.availabilityEndTime !== undefined ? dto.availabilityEndTime : undefined
    };

    return this.sellersRepository.create(userId, data);
  }

  async update(userId: string, id: string, dto: UpdateSellerDto): Promise<Seller> {
    await this.findById(userId, id);

    const data: Prisma.SellerUpdateInput = {
      name: dto.name ?? undefined,
      email: dto.email ?? undefined,
      contactNumber: dto.contactNumber ?? undefined,
      availabilityStartDay:
        dto.availabilityStartDay !== undefined ? dto.availabilityStartDay : undefined,
      availabilityEndDay: dto.availabilityEndDay !== undefined ? dto.availabilityEndDay : undefined,
      availabilityStartTime:
        dto.availabilityStartTime !== undefined ? dto.availabilityStartTime : undefined,
      availabilityEndTime: dto.availabilityEndTime !== undefined ? dto.availabilityEndTime : undefined
    };

    return this.sellersRepository.update(id, data);
  }

  async delete(userId: string, id: string): Promise<Seller> {
    await this.findById(userId, id);
    return this.sellersRepository.delete(id);
  }
}
