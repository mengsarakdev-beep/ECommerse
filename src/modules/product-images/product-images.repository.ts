import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ProductImagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.productImage.findMany({
      include: { product: true },
      orderBy: [{ is_primary: 'desc' }, { created_at: 'desc' }],
    });
  }

  findById(image_id: number) {
    return this.prisma.productImage.findUnique({
      where: { image_id },
      include: { product: true },
    });
  }

  findByProductId(product_id: number) {
    return this.prisma.productImage.findMany({
      where: { product_id },
      include: { product: true },
      orderBy: [{ is_primary: 'desc' }, { created_at: 'desc' }],
    });
  }

  findProductById(product_id: number) {
    return this.prisma.product.findUnique({
      where: { product_id },
      select: { product_id: true },
    });
  }

  create(data: { product_id: number; image: string; is_primary: boolean }) {
    return this.prisma.$transaction(async (tx) => {
      if (data.is_primary) {
        await tx.productImage.updateMany({
          where: { product_id: data.product_id },
          data: { is_primary: false },
        });
      }

      return tx.productImage.create({
        data,
        include: { product: true },
      });
    });
  }

  update(image_id: number, data: Prisma.ProductImageUpdateInput) {
    return this.prisma.productImage.update({
      where: { image_id },
      data,
      include: { product: true },
    });
  }

  updateAsPrimary(
    image_id: number,
    product_id: number,
    data: Prisma.ProductImageUpdateInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.productImage.updateMany({
        where: { product_id },
        data: { is_primary: false },
      });

      return tx.productImage.update({
        where: { image_id },
        data: { ...data, is_primary: true },
        include: { product: true },
      });
    });
  }

  remove(image_id: number) {
    return this.prisma.productImage.delete({
      where: { image_id },
      include: { product: true },
    });
  }
}
