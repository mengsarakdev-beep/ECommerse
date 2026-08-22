import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { CreateBrandDto } from './dto/create-brand.dto.js';
import { UpdateBrandDto } from './dto/update-brand.dto.js';
import { QueryBrandDto } from './dto/query-brand.dto.js';

type BrandWithProducts = Prisma.BrandGetPayload<{
  include: {
    products: true;
  };
}>;

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryBrandDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const search = query.search?.trim();

    const where: Prisma.BrandWhereInput = search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              slug: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {};

    const [brands, total] = await this.prisma.$transaction([
      this.prisma.brand.findMany({
        where,
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),

      this.prisma.brand.count({
        where,
      }),
    ]);

    return {
      data: brands,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(brand_id: number): Promise<BrandWithProducts> {
    const brand = await this.prisma.brand.findUnique({
      where: {
        brand_id,
      },
      include: {
        products: true,
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${brand_id} not found`);
    }

    return brand;
  }

  async create(data: CreateBrandDto) {
    const name = data.name.trim();
    const slug = data.slug.trim().toLowerCase();

    if (!name) {
      throw new BadRequestException('Brand name cannot be empty');
    }

    if (!slug) {
      throw new BadRequestException('Brand slug cannot be empty');
    }

    try {
      return await this.prisma.brand.create({
        data: {
          name,
          slug,
          description: data.description?.trim() || null,
          logo: data.logo?.trim() || null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Brand name or slug already exists');
      }

      throw error;
    }
  }

  async update(brand_id: number, data: UpdateBrandDto) {
    const brand = await this.prisma.brand.findUnique({
      where: {
        brand_id,
      },
      select: {
        brand_id: true,
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${brand_id} not found`);
    }

    const updateData: Prisma.BrandUpdateInput = {};

    if (data.name !== undefined) {
      const name = data.name.trim();

      if (!name) {
        throw new BadRequestException('Brand name cannot be empty');
      }

      updateData.name = name;
    }

    if (data.slug !== undefined) {
      const slug = data.slug.trim().toLowerCase();

      if (!slug) {
        throw new BadRequestException('Brand slug cannot be empty');
      }

      updateData.slug = slug;
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
    }

    if (data.logo !== undefined) {
      updateData.logo = data.logo?.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No fields provided for update');
    }

    try {
      return await this.prisma.brand.update({
        where: {
          brand_id,
        },
        data: updateData,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Brand name or slug already exists');
      }

      throw error;
    }
  }

  async remove(brand_id: number) {
    const brand = await this.prisma.brand.findUnique({
      where: {
        brand_id,
      },
      select: {
        brand_id: true,
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${brand_id} not found`);
    }

    const productsCount = await this.prisma.product.count({
      where: {
        brand_id,
      },
    });

    if (productsCount > 0) {
      throw new BadRequestException(
        `Cannot delete brand. ${productsCount} product(s) are assigned to this brand`,
      );
    }

    await this.prisma.brand.delete({
      where: {
        brand_id,
      },
    });
  }
}
