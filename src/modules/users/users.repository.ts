import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.UserCreateInput, select: Prisma.UserSelect) {
    return this.prisma.user.create({ data, select });
  }

  findPage(
    where: Prisma.UserWhereInput,
    skip: number,
    take: number,
    select: Prisma.UserSelect,
  ) {
    return this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        select,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
  }

  count(where?: Prisma.UserWhereInput) {
    return this.prisma.user.count({ where });
  }

  findById(user_id: number, select: Prisma.UserSelect) {
    return this.prisma.user.findUnique({
      where: { user_id },
      select,
    });
  }

  findByEmail(email: string, select: Prisma.UserSelect) {
    return this.prisma.user.findUnique({
      where: { email },
      select,
    });
  }

  update(
    user_id: number,
    data: Prisma.UserUpdateInput,
    select: Prisma.UserSelect,
  ) {
    return this.prisma.user.update({
      where: { user_id },
      data,
      select,
    });
  }

  updateRole(user_id: number, role: Role, select: Prisma.UserSelect) {
    return this.update(user_id, { role }, select);
  }

  remove(user_id: number) {
    return this.prisma.user.delete({ where: { user_id } });
  }

  findForAuth(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        user_id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        profile_image: true,
      },
    });
  }

  updatePassword(user_id: number, password: string) {
    return this.prisma.user.update({
      where: { user_id },
      data: { password },
    });
  }
}
