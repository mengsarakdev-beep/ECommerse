import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AddressesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly userSelect = {
    user_id: true,
    name: true,
    email: true,
    phone: true,
    profile_image: true,
  } as const;

  findAll() {
    return this.prisma.address.findMany({
      include: { user: { select: this.userSelect } },
      orderBy: { created_at: 'desc' },
    });
  }

  findById(address_id: number) {
    return this.prisma.address.findUnique({
      where: { address_id },
      include: { user: { select: this.userSelect } },
    });
  }

  findByUserId(user_id: number) {
    return this.prisma.address.findMany({
      where: { user_id },
      include: { user: { select: this.userSelect } },
      orderBy: { created_at: 'desc' },
    });
  }

  findUserById(user_id: number) {
    return this.prisma.user.findUnique({
      where: { user_id },
      select: { user_id: true },
    });
  }

  create(data: {
    user_id: number;
    recipient_name: string;
    phone: string;
    province: string | null;
    district: string | null;
    commune: string | null;
    street: string | null;
    is_default: boolean;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { user_id: data.user_id },
        select: { user_id: true },
      });

      if (!user) {
        return null;
      }

      if (data.is_default) {
        await tx.address.updateMany({
          where: { user_id: user.user_id, is_default: true },
          data: { is_default: false },
        });
      }

      return tx.address.create({
        data,
        include: { user: { select: this.userSelect } },
      });
    });
  }

  update(
    address_id: number,
    data: {
      recipient_name?: string;
      phone?: string;
      province?: string | null;
      district?: string | null;
      commune?: string | null;
      street?: string | null;
      is_default?: boolean;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const address = await tx.address.findUnique({
        where: { address_id },
        select: { address_id: true, user_id: true, is_default: true },
      });

      if (!address) {
        return null;
      }

      if (data.is_default === true && !address.is_default) {
        await tx.address.updateMany({
          where: {
            user_id: address.user_id,
            address_id: { not: address_id },
            is_default: true,
          },
          data: { is_default: false },
        });
      }

      return tx.address.update({
        where: { address_id },
        data,
        include: { user: { select: this.userSelect } },
      });
    });
  }

  remove(address_id: number) {
    return this.prisma.address.delete({
      where: { address_id },
      include: { user: { select: this.userSelect } },
    });
  }
}
