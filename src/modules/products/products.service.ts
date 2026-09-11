import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client.js';

import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { QueryProductDto } from './dto/query-product.dto.js';
import { ProductMapper } from './product.mapper.js';
import { ProductsRepository } from './products.repository.js';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

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

    const [products, total] = await this.productsRepository.findPage(
      where,
      skip,
      limit,
    );

    return {
      data: ProductMapper.toResponses(products),
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
    const product = await this.productsRepository.findById(product_id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found`);
    }

    return ProductMapper.toResponse(product);
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

    const category = await this.productsRepository.categoryExists(
      createProductDto.category_id,
    );

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createProductDto.category_id} not found`,
      );
    }

    if (
      createProductDto.brand_id !== undefined &&
      createProductDto.brand_id !== null
    ) {
      const brand = await this.productsRepository.brandExists(
        createProductDto.brand_id,
      );

      if (!brand) {
        throw new NotFoundException(
          `Brand with ID ${createProductDto.brand_id} not found`,
        );
      }
    }

    const product = await this.productsRepository.create({
      category_id: createProductDto.category_id,
      brand_id: createProductDto.brand_id ?? null,
      name,
      original_price: createProductDto.original_price,
      discount_percent: createProductDto.discount_percent ?? 0,
      price: createProductDto.price,
    });

    return ProductMapper.toResponse(product);
  }

  async update(product_id: number, updateProductDto: UpdateProductDto) {
    const product = await this.productsRepository.exists(product_id);

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
      const category = await this.productsRepository.categoryExists(
        updateProductDto.category_id,
      );

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
        const brand = await this.productsRepository.brandExists(
          updateProductDto.brand_id,
        );

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

    const updatedProduct = await this.productsRepository.update(
      product_id,
      data,
    );

    return ProductMapper.toResponse(updatedProduct);
  }

  async remove(product_id: number) {
    const product = await this.productsRepository.exists(product_id);

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
