import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class CartsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUser(user_id: number): Promise<Record<string, unknown> | null> {
    return this.prisma.cart.findUnique({
      where: { user_id },
      select: {
        cart_id: true,
        user_id: true,
        created_at: true,
        updated_at: true,
        items: {
          orderBy: { cart_item_id: 'asc' },
          select: {
            cart_item_id: true,
            cart_id: true,
            product_id: true,
            quantity: true,
            product: {
              select: {
                product_id: true,
                name: true,
                original_price: true,
                discount_percent: true,
                price: true,
                details: {
                  select: { stock: true, status: true },
                },
                images: {
                  where: { is_primary: true },
                  orderBy: { image_id: 'asc' },
                  take: 1,
                  select: { image_id: true, image: true },
                },
              },
            },
          },
        },
      },
    });
  }

  upsertForUser(user_id: number): Promise<Record<string, unknown>> {
    return this.prisma.cart.upsert({
      where: { user_id },
      update: {},
      create: { user_id },
      select: {
        cart_id: true,
        user_id: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  findUserById(user_id: number): Promise<{ user_id: number } | null> {
    return this.prisma.user.findUnique({
      where: { user_id },
      select: { user_id: true },
    });
  }
}
