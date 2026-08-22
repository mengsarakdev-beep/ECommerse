import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class WishlistsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.wishlist.findMany({
      include: { user: true, product: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findByUser(user_id: number) {
    return this.prisma.wishlist.findMany({
      where: { user_id },
      include: { user: true, product: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async add(user_id: number, product_id: number) {
    const user = await this.prisma.user.findUnique({ where: { user_id } });
    const product = await this.prisma.product.findUnique({
      where: { product_id },
    });

    if (!user) throw new NotFoundException(`User with ID ${user_id} not found`);
    if (!product)
      throw new NotFoundException(`Product with ID ${product_id} not found`);

    const existing = await this.prisma.wishlist.findUnique({
      where: {
        user_id_product_id: {
          user_id,
          product_id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Product is already in the wishlist');
    }

    return this.prisma.wishlist.create({
      data: { user_id, product_id },
      include: { user: true, product: true },
    });
  }

  async remove(wishlist_id: number) {
    const item = await this.prisma.wishlist.findUnique({
      where: { wishlist_id },
    });

    if (!item) {
      throw new NotFoundException(
        `Wishlist item with ID ${wishlist_id} not found`,
      );
    }

    return this.prisma.wishlist.delete({
      where: { wishlist_id },
      include: { user: true, product: true },
    });
  }
}
