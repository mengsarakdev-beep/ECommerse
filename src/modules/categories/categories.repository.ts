import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  findById(category_id: number) {
    return this.prisma.category.findUnique({
      where: { category_id },
      include: { products: true },
    });
  }

  exists(category_id: number) {
    return this.prisma.category.findUnique({
      where: { category_id },
      select: { category_id: true },
    });
  }

  create(data: { name: string; slug: string }) {
    return this.prisma.category.create({ data });
  }

  update(category_id: number, data: Prisma.CategoryUpdateInput) {
    return this.prisma.category.update({
      where: { category_id },
      data,
    });
  }

  countProducts(category_id: number) {
    return this.prisma.product.count({ where: { category_id } });
  }

  remove(category_id: number) {
    return this.prisma.category.delete({ where: { category_id } });
  }
}
