import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly userSelect = {
    user_id: true,
    name: true,
    email: true,
    phone: true,
    profile_image: true,
  };

  async findAll() {
    return this.prisma.address.findMany({
      include: {
        user: {
          select: this.userSelect,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findById(address_id: number) {
    const address = await this.prisma.address.findUnique({
      where: {
        address_id,
      },
      include: {
        user: {
          select: this.userSelect,
        },
      },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${address_id} not found`);
    }

    return address;
  }

  async findByUserId(user_id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        user_id,
      },
      select: {
        user_id: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    return this.prisma.address.findMany({
      where: {
        user_id,
      },
      include: {
        user: {
          select: this.userSelect,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async create(createAddressDto: CreateAddressDto) {
    const {
      user_id,
      recipient_name,
      phone,
      province,
      district,
      commune,
      street,
      is_default = false,
    } = createAddressDto;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: {
          user_id,
        },
        select: {
          user_id: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${user_id} not found`);
      }

      if (is_default) {
        await tx.address.updateMany({
          where: {
            user_id,
            is_default: true,
          },
          data: {
            is_default: false,
          },
        });
      }

      return tx.address.create({
        data: {
          user_id,
          recipient_name,
          phone,
          province: province ?? null,
          district: district ?? null,
          commune: commune ?? null,
          street: street ?? null,
          is_default,
        },
        include: {
          user: {
            select: this.userSelect,
          },
        },
      });
    });
  }

  async update(address_id: number, updateAddressDto: UpdateAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      const address = await tx.address.findUnique({
        where: {
          address_id,
        },
        select: {
          address_id: true,
          user_id: true,
          is_default: true,
        },
      });

      if (!address) {
        throw new NotFoundException(`Address with ID ${address_id} not found`);
      }

      if (updateAddressDto.is_default === true && !address.is_default) {
        await tx.address.updateMany({
          where: {
            user_id: address.user_id,
            address_id: {
              not: address_id,
            },
            is_default: true,
          },
          data: {
            is_default: false,
          },
        });
      }

      const data = {
        ...updateAddressDto,
      };

      delete data.user_id;

      return tx.address.update({
        where: {
          address_id,
        },
        data,
        include: {
          user: {
            select: this.userSelect,
          },
        },
      });
    });
  }

  async remove(address_id: number) {
    const address = await this.prisma.address.findUnique({
      where: {
        address_id,
      },
      select: {
        address_id: true,
      },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${address_id} not found`);
    }

    return this.prisma.address.delete({
      where: {
        address_id,
      },
      include: {
        user: {
          select: this.userSelect,
        },
      },
    });
  }
}
