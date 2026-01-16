import { Injectable } from '@nestjs/common';
import { Appointment, AppointmentStatus, LeadStage, Prisma } from '@prisma/client';

import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

export interface AppointmentQuery extends PaginationQueryDto {
  status?: AppointmentStatus;
  start?: string;
  end?: string;
}

export interface PaginatedAppointments {
  data: (Appointment & {
    lead: {
      id: string;
      name: string | null;
      email: string | null;
      contact: string | null;
      stage: LeadStage | null;
    };
  })[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(userId: string, query: AppointmentQuery): Promise<PaginatedAppointments> {
    const { page = 1, limit = 20, status, start, end, search } = query;
    const where: Prisma.AppointmentWhereInput = {
      userId,
      ...(status ? { status } : {}),
      ...(start || end
        ? {
            start: start ? { gte: new Date(start) } : undefined,
            end: end ? { lte: new Date(end) } : undefined
          }
        : {}),
      ...(search
        ? {
            OR: [
              { lead: { name: { contains: search, mode: 'insensitive' } } },
              { lead: { email: { contains: search, mode: 'insensitive' } } },
              { lead: { contact: { contains: search, mode: 'insensitive' } } }
            ]
          }
        : {})
    };

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              contact: true,
              stage: true
            }
          }
        },
        orderBy: { start: 'desc' }
      }),
      this.prisma.appointment.count({ where })
    ]);

    return { data, total, page, limit };
  }

  findById(userId: string, id: string) {
    return this.prisma.appointment.findFirst({
      where: { id, userId },
      include: {
        lead: true
      }
    });
  }

  create(
    userId: string,
    data: Omit<Prisma.AppointmentUncheckedCreateInput, 'userId'>
  ): Promise<Appointment> {
    return this.prisma.appointment.create({ data: { ...data, userId } });
  }

  update(id: string, data: Prisma.AppointmentUpdateInput): Promise<Appointment> {
    return this.prisma.appointment.update({ where: { id }, data });
  }

  delete(id: string): Promise<Appointment> {
    return this.prisma.appointment.delete({ where: { id } });
  }
}
