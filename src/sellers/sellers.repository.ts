import { Injectable } from '@nestjs/common';
import { Prisma, Seller } from '@prisma/client';

import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

export interface PaginatedSellers {
  data: Seller[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class SellersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(userId: string, query: PaginationQueryDto): Promise<PaginatedSellers> {
    const { page = 1, limit = 20, search } = query;

    const where: Prisma.SellerWhereInput = {
      userId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { contactNumber: { contains: search, mode: 'insensitive' } }
            ]
          }
        : {})
    };

    const [data, total] = await Promise.all([
      this.prisma.seller.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.seller.count({ where })
    ]);

    return { data, total, page, limit };
  }

  findById(userId: string, id: string): Promise<Seller | null> {
    return this.prisma.seller.findFirst({
      where: { id, userId }
    });
  }

  create(userId: string, data: Omit<Prisma.SellerUncheckedCreateInput, 'userId'>): Promise<Seller> {
    return this.prisma.seller.create({
      data: { ...data, userId }
    });
  }

  update(id: string, data: Prisma.SellerUpdateInput): Promise<Seller> {
    return this.prisma.seller.update({
      where: { id },
      data
    });
  }

  delete(id: string): Promise<Seller> {
    return this.prisma.seller.delete({
      where: { id }
    });
  }
}
