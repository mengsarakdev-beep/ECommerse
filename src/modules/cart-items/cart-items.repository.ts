import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class CartItemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCartByUser(user_id: number) {
    return this.prisma.cart.findUnique({
      where: { user_id },
      select: { cart_id: true },
    });
  }

  findByUser(user_id: number, productSelect: object) {
    return this.prisma.cartItem.findMany({
      where: { cart: { user_id } },
      orderBy: { cart_item_id: 'asc' },
      select: {
        cart_item_id: true,
        cart_id: true,
        product_id: true,
        quantity: true,
        product: { select: productSelect },
      },
    });
  }

  findByIdForUser(
    user_id: number,
    cart_item_id: number,
    productSelect: object,
  ) {
    return this.prisma.cartItem.findFirst({
      where: { cart_item_id, cart: { user_id } },
      select: {
        cart_item_id: true,
        cart_id: true,
        product_id: true,
        quantity: true,
        product: { select: productSelect },
      },
    });
  }

  removeForUser(user_id: number, cart_item_id: number) {
    return this.prisma.cartItem.deleteMany({
      where: { cart_item_id, cart: { user_id } },
    });
  }
}
