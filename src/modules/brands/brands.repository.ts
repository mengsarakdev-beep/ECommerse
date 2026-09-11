import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class BrandsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPage(where: Prisma.BrandWhereInput, skip: number, take: number) {
    return this.prisma.$transaction([
      this.prisma.brand.findMany({
        where,
        include: { _count: { select: { products: true } } },
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.brand.count({ where }),
    ]);
  }

  findById(brand_id: number) {
    return this.prisma.brand.findUnique({
      where: { brand_id },
      include: { products: true },
    });
  }

  exists(brand_id: number) {
    return this.prisma.brand.findUnique({
      where: { brand_id },
      select: { brand_id: true },
    });
  }

  create(data: Prisma.BrandCreateInput) {
    return this.prisma.brand.create({ data });
  }

  update(brand_id: number, data: Prisma.BrandUpdateInput) {
    return this.prisma.brand.update({ where: { brand_id }, data });
  }

  countProducts(brand_id: number) {
    return this.prisma.product.count({ where: { brand_id } });
  }

  remove(brand_id: number) {
    return this.prisma.brand.delete({ where: { brand_id } });
  }
}
