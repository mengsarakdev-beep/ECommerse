import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.review.findMany({
      include: { user: true, product: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(review_id: number) {
    const review = await this.prisma.review.findUnique({
      where: { review_id },
      include: { user: true, product: true },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${review_id} not found`);
    }

    return review;
  }

  async create(data: { user_id: number; product_id: number; rating: number }) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: data.user_id },
    });
    const product = await this.prisma.product.findUnique({
      where: { product_id: data.product_id },
    });

    if (!user)
      throw new NotFoundException(`User with ID ${data.user_id} not found`);
    if (!product)
      throw new NotFoundException(
        `Product with ID ${data.product_id} not found`,
      );

    const existing = await this.prisma.review.findUnique({
      where: {
        user_id_product_id: {
          user_id: data.user_id,
          product_id: data.product_id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User has already reviewed this product');
    }

    return this.prisma.review.create({
      data: {
        user_id: data.user_id,
        product_id: data.product_id,
        rating: data.rating,
      },
      include: { user: true, product: true },
    });
  }

  async update(review_id: number, rating: number) {
    await this.findById(review_id);

    return this.prisma.review.update({
      where: { review_id },
      data: { rating },
      include: { user: true, product: true },
    });
  }

  async remove(review_id: number) {
    await this.findById(review_id);

    return this.prisma.review.delete({
      where: { review_id },
      include: { user: true, product: true },
    });
  }
}
