import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersCrudService } from './users-crud.service.js';

@Injectable()
export class UsersRelationsService extends UsersCrudService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  // =========================================================
  // VALIDATE USER ID
  // =========================================================

  private validateUserId(user_id: number): void {
    if (!Number.isInteger(user_id) || user_id <= 0) {
      throw new BadRequestException('Invalid user ID');
    }
  }

  // =========================================================
  // PAGINATION
  // =========================================================

  private getPagination(page: number, limit: number) {
    const requestedPage = Number(page);
    const requestedLimit = Number(limit);

    const safePage =
      Number.isFinite(requestedPage) && requestedPage > 0
        ? Math.floor(requestedPage)
        : UsersCrudService.DEFAULT_PAGE;

    const safeLimit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(Math.floor(requestedLimit), UsersCrudService.MAX_LIMIT)
        : UsersCrudService.DEFAULT_LIMIT;

    return {
      page: safePage,
      limit: safeLimit,
      skip: (safePage - 1) * safeLimit,
    };
  }

  // =========================================================
  // USER ADDRESSES
  // =========================================================

  async getUserAddresses(user_id: number) {
    this.validateUserId(user_id);

    return this.prisma.address.findMany({
      where: {
        user_id,
      },

      select: {
        address_id: true,
        user_id: true,
        recipient_name: true,
        phone: true,
        province: true,
        district: true,
        commune: true,
        street: true,
        is_default: true,
        created_at: true,
        updated_at: true,
      },

      orderBy: {
        created_at: 'desc',
      },
    });
  }

  // =========================================================
  // USER ORDERS
  // =========================================================

  async getUserOrders(
    user_id: number,
    page = UsersCrudService.DEFAULT_PAGE,
    limit = UsersCrudService.DEFAULT_LIMIT,
  ) {
    this.validateUserId(user_id);

    const pagination = this.getPagination(page, limit);

    const where: Prisma.OrderWhereInput = {
      user_id,
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,

        skip: pagination.skip,
        take: pagination.limit,

        select: {
          order_id: true,
          order_date: true,
          total_amount: true,
          status: true,

          items: {
            select: {
              order_item_id: true,
              quantity: true,
              price: true,
              subtotal: true,

              product: {
                select: {
                  product_id: true,
                  name: true,
                },
              },
            },
          },

          status_history: {
            select: {
              history_id: true,
              status: true,
              note: true,
              created_at: true,
            },

            orderBy: {
              created_at: 'desc',
            },
          },

          address: {
            select: {
              address_id: true,
              recipient_name: true,
              phone: true,
              province: true,
              district: true,
              commune: true,
              street: true,
            },
          },
        },

        orderBy: {
          order_date: 'desc',
        },
      }),

      this.prisma.order.count({
        where,
      }),
    ]);

    return {
      data: orders,

      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  // =========================================================
  // USER REVIEWS
  // =========================================================

  async getUserReviews(
    user_id: number,
    page = UsersCrudService.DEFAULT_PAGE,
    limit = UsersCrudService.DEFAULT_LIMIT,
  ) {
    this.validateUserId(user_id);

    const pagination = this.getPagination(page, limit);

    const where: Prisma.ReviewWhereInput = {
      user_id,
    };

    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,

        skip: pagination.skip,
        take: pagination.limit,

        select: {
          review_id: true,
          rating: true,
          created_at: true,

          product: {
            select: {
              product_id: true,
              name: true,
            },
          },
        },

        orderBy: {
          created_at: 'desc',
        },
      }),

      this.prisma.review.count({
        where,
      }),
    ]);

    return {
      data: reviews,

      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  // =========================================================
  // USER CART
  // =========================================================

  async getUserCart(user_id: number) {
    this.validateUserId(user_id);

    return this.prisma.cart.findUnique({
      where: {
        user_id,
      },

      select: {
        cart_id: true,
        user_id: true,
        created_at: true,
        updated_at: true,

        items: {
          select: {
            cart_item_id: true,
            quantity: true,

            product: {
              select: {
                product_id: true,
                name: true,
                price: true,

                images: {
                  where: {
                    is_primary: true,
                  },

                  take: 1,

                  select: {
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // =========================================================
  // USER WISHLISTS
  // =========================================================

  async getUserWishlists(
    user_id: number,
    page = UsersCrudService.DEFAULT_PAGE,
    limit = UsersCrudService.DEFAULT_LIMIT,
  ) {
    this.validateUserId(user_id);

    const pagination = this.getPagination(page, limit);

    const where: Prisma.WishlistWhereInput = {
      user_id,
    };

    const [wishlists, total] = await this.prisma.$transaction([
      this.prisma.wishlist.findMany({
        where,

        skip: pagination.skip,
        take: pagination.limit,

        select: {
          wishlist_id: true,
          created_at: true,

          product: {
            select: {
              product_id: true,
              name: true,
              price: true,

              images: {
                where: {
                  is_primary: true,
                },

                take: 1,

                select: {
                  image: true,
                },
              },
            },
          },
        },

        orderBy: {
          created_at: 'desc',
        },
      }),

      this.prisma.wishlist.count({
        where,
      }),
    ]);

    return {
      data: wishlists,

      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }
}
