import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { ProductStatus } from '../../generated/prisma/enums.js';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CartItemsService {
  private static readonly MAX_QUANTITY = 100;
  private static readonly TRANSACTION_MAX_RETRIES = 3;
  private static readonly RETRY_BASE_DELAY_MS = 25;

  private readonly productSelect = {
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
  } satisfies Prisma.ProductSelect;

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // GET MY CART ITEMS
  // GET /carts/me/items
  // ============================================================

  async findByUser(user_id: number) {
    this.validateId(user_id, 'User ID');

    const cart = await this.prisma.cart.findUnique({
      where: {
        user_id,
      },
      select: {
        cart_id: true,
      },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    return this.prisma.cartItem.findMany({
      where: {
        cart_id: cart.cart_id,
      },
      orderBy: {
        cart_item_id: 'asc',
      },
      select: {
        cart_item_id: true,
        cart_id: true,
        product_id: true,
        quantity: true,

        product: {
          select: this.productSelect,
        },
      },
    });
  }

  // ============================================================
  // GET SINGLE CART ITEM
  // GET /carts/me/items/:cart_item_id
  // ============================================================

  async findById(user_id: number, cart_item_id: number) {
    this.validateId(user_id, 'User ID');
    this.validateId(cart_item_id, 'Cart Item ID');

    const item = await this.prisma.cartItem.findFirst({
      where: {
        cart_item_id,
        cart: {
          user_id,
        },
      },
      select: {
        cart_item_id: true,
        cart_id: true,
        product_id: true,
        quantity: true,

        product: {
          select: this.productSelect,
        },
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Cart item with ID ${cart_item_id} not found`,
      );
    }

    return item;
  }

  // ============================================================
  // ADD PRODUCT TO CART
  // POST /carts/me/items
  // ============================================================

  async addToCart(user_id: number, product_id: number, quantity = 1) {
    this.validateId(user_id, 'User ID');
    this.validateId(product_id, 'Product ID');
    this.validateQuantity(quantity);

    return this.runSerializableTransaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: {
          user_id,
        },
        update: {},
        create: {
          user_id,
        },
        select: {
          cart_id: true,
        },
      });

      const product = await tx.product.findUnique({
        where: {
          product_id,
        },
        select: this.productSelect,
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${product_id} not found`);
      }

      this.validateProductAvailability(product);

      const stock = product.details!.stock;

      const existingItem = await tx.cartItem.findUnique({
        where: {
          cart_id_product_id: {
            cart_id: cart.cart_id,
            product_id,
          },
        },
        select: {
          quantity: true,
        },
      });

      const currentQuantity = existingItem?.quantity ?? 0;
      const newQuantity = currentQuantity + quantity;

      if (!Number.isSafeInteger(newQuantity)) {
        throw new BadRequestException('Quantity is too large');
      }

      this.validateQuantity(newQuantity);
      this.validateStock(newQuantity, stock);

      return tx.cartItem.upsert({
        where: {
          cart_id_product_id: {
            cart_id: cart.cart_id,
            product_id,
          },
        },

        update: {
          quantity: newQuantity,
        },

        create: {
          cart_id: cart.cart_id,
          product_id,
          quantity,
        },

        select: {
          cart_item_id: true,
          cart_id: true,
          product_id: true,
          quantity: true,

          product: {
            select: this.productSelect,
          },
        },
      });
    });
  }

  // ============================================================
  // UPDATE CART ITEM
  // PATCH /carts/me/items/:cart_item_id
  // ============================================================

  async updateQuantity(
    user_id: number,
    cart_item_id: number,
    quantity: number,
  ) {
    this.validateId(user_id, 'User ID');
    this.validateId(cart_item_id, 'Cart Item ID');
    this.validateQuantity(quantity);

    return this.runSerializableTransaction(async (tx) => {
      const item = await tx.cartItem.findFirst({
        where: {
          cart_item_id,
          cart: {
            user_id,
          },
        },
        select: {
          cart_item_id: true,
          cart_id: true,
          product_id: true,

          product: {
            select: this.productSelect,
          },
        },
      });

      if (!item) {
        throw new NotFoundException(
          `Cart item with ID ${cart_item_id} not found`,
        );
      }

      this.validateProductAvailability(item.product);

      this.validateStock(quantity, item.product.details!.stock);

      return tx.cartItem.update({
        where: {
          cart_item_id,
        },
        data: {
          quantity,
        },
        select: {
          cart_item_id: true,
          cart_id: true,
          product_id: true,
          quantity: true,

          product: {
            select: this.productSelect,
          },
        },
      });
    });
  }

  // ============================================================
  // REMOVE CART ITEM
  // DELETE /carts/me/items/:cart_item_id
  // ============================================================

  async remove(user_id: number, cart_item_id: number) {
    this.validateId(user_id, 'User ID');
    this.validateId(cart_item_id, 'Cart Item ID');

    const result = await this.prisma.cartItem.deleteMany({
      where: {
        cart_item_id,
        cart: {
          user_id,
        },
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        `Cart item with ID ${cart_item_id} not found`,
      );
    }

    return {
      message: 'Cart item removed successfully',
      cart_item_id,
    };
  }

  // ============================================================
  // PRODUCT VALIDATION
  // ============================================================

  private validateProductAvailability(product: {
    details: {
      stock: number;
      status: ProductStatus;
    } | null;
  }): void {
    if (!product.details) {
      throw new BadRequestException('Product details are not available');
    }

    if (product.details.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException('This product is not available');
    }

    if (
      !Number.isSafeInteger(product.details.stock) ||
      product.details.stock < 0
    ) {
      throw new BadRequestException('Invalid product stock');
    }

    if (product.details.stock === 0) {
      throw new BadRequestException('This product is out of stock');
    }
  }

  // ============================================================
  // STOCK VALIDATION
  // ============================================================

  private validateStock(quantity: number, stock: number): void {
    if (!Number.isSafeInteger(stock) || stock < 0) {
      throw new BadRequestException('Invalid product stock');
    }

    if (quantity > stock) {
      throw new BadRequestException(`Only ${stock} item(s) available in stock`);
    }
  }

  // ============================================================
  // QUANTITY VALIDATION
  // ============================================================

  private validateQuantity(quantity: number): void {
    if (!Number.isSafeInteger(quantity)) {
      throw new BadRequestException('Quantity must be a safe integer');
    }

    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    if (quantity > CartItemsService.MAX_QUANTITY) {
      throw new BadRequestException(
        `Quantity cannot exceed ${CartItemsService.MAX_QUANTITY}`,
      );
    }
  }

  // ============================================================
  // ID VALIDATION
  // ============================================================

  private validateId(value: number, fieldName: string): void {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new BadRequestException(`${fieldName} must be a positive integer`);
    }
  }

  // ============================================================
  // SERIALIZABLE TRANSACTION
  // ============================================================

  private async runSerializableTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (
      let attempt = 1;
      attempt <= CartItemsService.TRANSACTION_MAX_RETRIES;
      attempt++
    ) {
      try {
        return await this.prisma.$transaction(callback, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if (
          !this.isRetryableTransactionError(error) ||
          attempt === CartItemsService.TRANSACTION_MAX_RETRIES
        ) {
          throw error;
        }

        await this.sleep(
          CartItemsService.RETRY_BASE_DELAY_MS * 2 ** (attempt - 1),
        );
      }
    }

    throw new Error('Serializable transaction failed unexpectedly');
  }

  // ============================================================
  // RETRYABLE TRANSACTION ERROR
  // ============================================================

  private isRetryableTransactionError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    );
  }

  // ============================================================
  // SLEEP
  // ============================================================

  private sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }
}
