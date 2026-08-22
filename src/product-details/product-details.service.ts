import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

import { ProductStatus } from '../../generated/prisma/enums.js';
import { Prisma } from '../../generated/prisma/client.js';

import { CreateProductDetailDto } from './dto/create-product-detail.dto.js';
import { UpdateProductDetailDto } from './dto/update-product-detail.dto.js';

@Injectable()
export class ProductDetailsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.productDetail.findMany({
      include: {
        product: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findById(detail_id: number) {
    const detail = await this.prisma.productDetail.findUnique({
      where: {
        detail_id,
      },
      include: {
        product: true,
      },
    });

    if (!detail) {
      throw new NotFoundException(
        `Product detail with ID ${detail_id} not found`,
      );
    }

    return detail;
  }

  async findByProductId(product_id: number) {
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

    const detail = await this.prisma.productDetail.findUnique({
      where: {
        product_id,
      },
      include: {
        product: true,
      },
    });

    if (!detail) {
      throw new NotFoundException(
        `Product detail for product ID ${product_id} not found`,
      );
    }

    return detail;
  }

  async create(createProductDetailDto: CreateProductDetailDto) {
    const product_id = createProductDetailDto.product_id;

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

    try {
      return await this.prisma.productDetail.create({
        data: {
          product: {
            connect: {
              product_id,
            },
          },

          description: createProductDetailDto.description?.trim() || null,

          stock: createProductDetailDto.stock,

          status: createProductDetailDto.status ?? ProductStatus.ACTIVE,

          color: createProductDetailDto.color?.trim() || null,
        },

        include: {
          product: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'Product detail already exists for this product',
          );
        }
      }

      throw error;
    }
  }

  async update(
    detail_id: number,
    updateProductDetailDto: UpdateProductDetailDto,
  ) {
    const detail = await this.prisma.productDetail.findUnique({
      where: {
        detail_id,
      },
      select: {
        detail_id: true,
      },
    });

    if (!detail) {
      throw new NotFoundException(
        `Product detail with ID ${detail_id} not found`,
      );
    }

    const data: {
      description?: string | null;
      stock?: number;
      status?: ProductStatus;
      color?: string | null;
    } = {};

    if (updateProductDetailDto.description !== undefined) {
      data.description = updateProductDetailDto.description?.trim() || null;
    }

    if (updateProductDetailDto.stock !== undefined) {
      data.stock = updateProductDetailDto.stock;
    }

    if (updateProductDetailDto.status !== undefined) {
      data.status = updateProductDetailDto.status;
    }

    if (updateProductDetailDto.color !== undefined) {
      data.color = updateProductDetailDto.color?.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields provided for update');
    }

    return this.prisma.productDetail.update({
      where: {
        detail_id,
      },

      data,

      include: {
        product: true,
      },
    });
  }

  async remove(detail_id: number) {
    const detail = await this.prisma.productDetail.findUnique({
      where: {
        detail_id,
      },
      select: {
        detail_id: true,
      },
    });

    if (!detail) {
      throw new NotFoundException(
        `Product detail with ID ${detail_id} not found`,
      );
    }

    return this.prisma.productDetail.delete({
      where: {
        detail_id,
      },
      include: {
        product: true,
      },
    });
  }
}
