import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class WishlistsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.wishlist.findMany({
      include: { user: true, product: true },
      orderBy: { created_at: 'desc' },
    });
  }

  findByUser(user_id: number) {
    return this.prisma.wishlist.findMany({
      where: { user_id },
      include: { user: true, product: true },
      orderBy: { created_at: 'desc' },
    });
  }

  findUserById(user_id: number) {
    return this.prisma.user.findUnique({ where: { user_id } });
  }

  findProductById(product_id: number) {
    return this.prisma.product.findUnique({ where: { product_id } });
  }

  findExisting(user_id: number, product_id: number) {
    return this.prisma.wishlist.findUnique({
      where: { user_id_product_id: { user_id, product_id } },
    });
  }

  create(data: Prisma.WishlistUncheckedCreateInput) {
    return this.prisma.wishlist.create({
      data,
      include: { user: true, product: true },
    });
  }

  findById(wishlist_id: number) {
    return this.prisma.wishlist.findUnique({ where: { wishlist_id } });
  }

  remove(wishlist_id: number) {
    return this.prisma.wishlist.delete({
      where: { wishlist_id },
      include: { user: true, product: true },
    });
  }
}
