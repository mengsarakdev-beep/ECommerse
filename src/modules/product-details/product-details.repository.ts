import { Injectable } from '@nestjs/common';
import { ProductStatus } from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ProductDetailsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.productDetail.findMany({
      include: { product: true },
      orderBy: { created_at: 'desc' },
    });
  }

  findById(detail_id: number) {
    return this.prisma.productDetail.findUnique({
      where: { detail_id },
      include: { product: true },
    });
  }

  findByProductId(product_id: number) {
    return this.prisma.productDetail.findUnique({
      where: { product_id },
      include: { product: true },
    });
  }

  findProductById(product_id: number) {
    return this.prisma.product.findUnique({
      where: { product_id },
      select: { product_id: true },
    });
  }

  create(data: {
    product_id: number;
    description: string | null;
    stock: number;
    status: ProductStatus;
    color: string | null;
  }) {
    return this.prisma.productDetail.create({
      data,
      include: { product: true },
    });
  }

  update(
    detail_id: number,
    data: {
      description?: string | null;
      stock?: number;
      status?: ProductStatus;
      color?: string | null;
    },
  ) {
    return this.prisma.productDetail.update({
      where: { detail_id },
      data,
      include: { product: true },
    });
  }

  remove(detail_id: number) {
    return this.prisma.productDetail.delete({
      where: { detail_id },
      include: { product: true },
    });
  }
}
