import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { QueryProductDto } from './dto/query-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly productInclude = {
    category: true,
    brand: true,
    details: true,
    images: {
      orderBy: {
        is_primary: 'desc' as const,
      },
    },
  };

  async findAll(query: QueryProductDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const search = query.search?.trim();

    if (
      query.min_price !== undefined &&
      query.max_price !== undefined &&
      query.min_price > query.max_price
    ) {
      throw new BadRequestException(
        'min_price cannot be greater than max_price',
      );
    }

    const where: Prisma.ProductWhereInput = {
      ...(search
        ? {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : {}),

      ...(query.category_id !== undefined
        ? {
            category_id: query.category_id,
          }
        : {}),

      ...(query.brand_id !== undefined
        ? {
            brand_id: query.brand_id,
          }
        : {}),

      ...(query.status !== undefined
        ? {
            details: {
              is: {
                status: query.status,
              },
            },
          }
        : {}),

      ...(query.min_price !== undefined || query.max_price !== undefined
        ? {
            price: {
              ...(query.min_price !== undefined
                ? {
                    gte: query.min_price,
                  }
                : {}),
              ...(query.max_price !== undefined
                ? {
                    lte: query.max_price,
                  }
                : {}),
            },
          }
        : {}),
    };

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: this.productInclude,
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),

      this.prisma.product.count({
        where,
      }),
    ]);

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(product_id: number) {
    const product = await this.prisma.product.findUnique({
      where: {
        product_id,
      },
      include: this.productInclude,
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto) {
    const name = createProductDto.name.trim();

    if (!name) {
      throw new BadRequestException('Product name cannot be empty');
    }

    const originalPrice = Number(createProductDto.original_price);

    const discountPercent = Number(createProductDto.discount_percent ?? 0);

    const price = Number(createProductDto.price);

    if (originalPrice < 0) {
      throw new BadRequestException('Original price cannot be negative');
    }

    if (discountPercent < 0 || discountPercent > 100) {
      throw new BadRequestException(
        'Discount percent must be between 0 and 100',
      );
    }

    if (price < 0) {
      throw new BadRequestException('Price cannot be negative');
    }

    const category = await this.prisma.category.findUnique({
      where: {
        category_id: createProductDto.category_id,
      },
      select: {
        category_id: true,
      },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createProductDto.category_id} not found`,
      );
    }

    if (createProductDto.brand_id !== undefined) {
      const brand = await this.prisma.brand.findUnique({
        where: {
          brand_id: createProductDto.brand_id ?? undefined,
        },
        select: {
          brand_id: true,
        },
      });

      if (!brand) {
        throw new NotFoundException(
          `Brand with ID ${createProductDto.brand_id} not found`,
        );
      }
    }

    return this.prisma.product.create({
      data: {
        category_id: createProductDto.category_id,

        brand_id: createProductDto.brand_id ?? null,

        name,

        original_price: createProductDto.original_price,

        discount_percent: createProductDto.discount_percent ?? 0,

        price: createProductDto.price,
      },

      include: this.productInclude,
    });
  }

  async update(product_id: number, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: {
        product_id,
      },
      select: {
        product_id: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found`);
    }

    const data: Prisma.ProductUpdateInput = {};

    if (updateProductDto.name !== undefined) {
      const name = updateProductDto.name.trim();

      if (!name) {
        throw new BadRequestException('Product name cannot be empty');
      }

      data.name = name;
    }

    if (updateProductDto.category_id !== undefined) {
      const category = await this.prisma.category.findUnique({
        where: {
          category_id: updateProductDto.category_id,
        },
        select: {
          category_id: true,
        },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with ID ${updateProductDto.category_id} not found`,
        );
      }

      data.category = {
        connect: {
          category_id: updateProductDto.category_id,
        },
      };
    }

    if (updateProductDto.brand_id !== undefined) {
      if (updateProductDto.brand_id === null) {
        data.brand = {
          disconnect: true,
        };
      } else {
        const brand = await this.prisma.brand.findUnique({
          where: {
            brand_id: updateProductDto.brand_id,
          },
          select: {
            brand_id: true,
          },
        });

        if (!brand) {
          throw new NotFoundException(
            `Brand with ID ${updateProductDto.brand_id} not found`,
          );
        }

        data.brand = {
          connect: {
            brand_id: updateProductDto.brand_id,
          },
        };
      }
    }

    if (updateProductDto.original_price !== undefined) {
      if (Number(updateProductDto.original_price) < 0) {
        throw new BadRequestException('Original price cannot be negative');
      }

      data.original_price = updateProductDto.original_price;
    }

    if (updateProductDto.discount_percent !== undefined) {
      const discount = Number(updateProductDto.discount_percent);

      if (discount < 0 || discount > 100) {
        throw new BadRequestException(
          'Discount percent must be between 0 and 100',
        );
      }

      data.discount_percent = updateProductDto.discount_percent;
    }

    if (updateProductDto.price !== undefined) {
      if (Number(updateProductDto.price) < 0) {
        throw new BadRequestException('Price cannot be negative');
      }

      data.price = updateProductDto.price;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields provided for update');
    }

    return this.prisma.product.update({
      where: {
        product_id,
      },
      data,
      include: this.productInclude,
    });
  }

  async remove(product_id: number) {
    const product = await this.prisma.product.findUnique({
      where: {
        product_id,
      },
      select: {
        product_id: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found`);
    }

    /*
     * Product is referenced by:
     * - CartItem
     * - OrderItem
     * - Review
     * - Wishlist
     * - ProductDetail
     * - ProductImage
     *
     * Deleting a product directly can therefore
     * violate foreign-key constraints.
     *
     * For an e-commerce system, soft deletion /
     * INACTIVE status is usually safer.
     */

    throw new BadRequestException(
      'Products should not be permanently deleted. Set the product status to INACTIVE instead.',
    );
  }
}
