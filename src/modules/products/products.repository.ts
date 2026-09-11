import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly productInclude = {
    category: true,
    brand: true,
    details: true,
    images: { orderBy: { is_primary: 'desc' as const } },
  } satisfies Prisma.ProductInclude;

  findPage(where: Prisma.ProductWhereInput, skip: number, take: number) {
    return this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: this.productInclude,
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.product.count({ where }),
    ]);
  }

  findById(product_id: number) {
    return this.prisma.product.findUnique({
      where: { product_id },
      include: this.productInclude,
    });
  }

  exists(product_id: number) {
    return this.prisma.product.findUnique({
      where: { product_id },
      select: { product_id: true },
    });
  }

  categoryExists(category_id: number) {
    return this.prisma.category.findUnique({
      where: { category_id },
      select: { category_id: true },
    });
  }

  brandExists(brand_id: number) {
    return this.prisma.brand.findUnique({
      where: { brand_id },
      select: { brand_id: true },
    });
  }

  create(data: Prisma.ProductUncheckedCreateInput) {
    return this.prisma.product.create({
      data,
      include: this.productInclude,
    });
  }

  update(product_id: number, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({
      where: { product_id },
      data,
      include: this.productInclude,
    });
  }
}
