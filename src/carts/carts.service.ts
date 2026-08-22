import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // GET MY CART
  // ============================================================

  async findByUser(user_id: number) {
    this.validateId(user_id, 'User ID');

    const cart = await this.prisma.cart.findUnique({
      where: {
        user_id,
      },

      select: {
        cart_id: true,
        user_id: true,
        created_at: true,
        updated_at: true,

        items: {
          orderBy: {
            cart_item_id: 'asc',
          },

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
                  select: {
                    stock: true,
                    status: true,
                  },
                },

                images: {
                  where: {
                    is_primary: true,
                  },

                  orderBy: {
                    image_id: 'asc',
                  },

                  take: 1,

                  select: {
                    image_id: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException(`Cart for user ${user_id} not found`);
    }

    return cart;
  }

  // ============================================================
  // CREATE MY CART
  // ============================================================

  async createForUser(user_id: number) {
    this.validateId(user_id, 'User ID');

    await this.ensureUserExists(user_id);

    return this.prisma.cart.upsert({
      where: {
        user_id,
      },

      update: {},

      create: {
        user_id,
      },

      select: {
        cart_id: true,
        user_id: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  // ============================================================
  // GET OR CREATE MY CART
  // ============================================================

  async getOrCreateForUser(user_id: number) {
    this.validateId(user_id, 'User ID');

    await this.ensureUserExists(user_id);

    return this.prisma.cart.upsert({
      where: {
        user_id,
      },

      update: {},

      create: {
        user_id,
      },

      select: {
        cart_id: true,
        user_id: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  // ============================================================
  // CHECK USER
  // ============================================================

  private async ensureUserExists(user_id: number): Promise<void> {
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
  }

  // ============================================================
  // VALIDATE ID
  // ============================================================

  private validateId(value: number, fieldName: string): void {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new BadRequestException(`${fieldName} must be a positive integer`);
    }
  }
}
