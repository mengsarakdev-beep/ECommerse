import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.review.findMany({
      include: { user: true, product: true },
      orderBy: { created_at: 'desc' },
    });
  }

  findById(review_id: number) {
    return this.prisma.review.findUnique({
      where: { review_id },
      include: { user: true, product: true },
    });
  }

  findUserById(user_id: number) {
    return this.prisma.user.findUnique({ where: { user_id } });
  }

  findProductById(product_id: number) {
    return this.prisma.product.findUnique({ where: { product_id } });
  }

  findExisting(user_id: number, product_id: number) {
    return this.prisma.review.findUnique({
      where: { user_id_product_id: { user_id, product_id } },
    });
  }

  create(data: Prisma.ReviewUncheckedCreateInput) {
    return this.prisma.review.create({
      data,
      include: { user: true, product: true },
    });
  }

  update(review_id: number, rating: number) {
    return this.prisma.review.update({
      where: { review_id },
      data: { rating },
      include: { user: true, product: true },
    });
  }

  remove(review_id: number) {
    return this.prisma.review.delete({
      where: { review_id },
      include: { user: true, product: true },
    });
  }
}
