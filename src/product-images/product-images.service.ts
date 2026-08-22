import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { CreateProductImageDto } from './dto/create-product-image.dto.js';
import { UpdateProductImageDto } from './dto/update-product-image.dto.js';

@Injectable()
export class ProductImagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.productImage.findMany({
      include: {
        product: true,
      },
      orderBy: [
        {
          is_primary: 'desc',
        },
        {
          created_at: 'desc',
        },
      ],
    });
  }

  async findById(image_id: number) {
    const image = await this.prisma.productImage.findUnique({
      where: {
        image_id,
      },
      include: {
        product: true,
      },
    });

    if (!image) {
      throw new NotFoundException(
        `Product image with ID ${image_id} not found`,
      );
    }

    return image;
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

    return this.prisma.productImage.findMany({
      where: {
        product_id,
      },
      include: {
        product: true,
      },
      orderBy: [
        {
          is_primary: 'desc',
        },
        {
          created_at: 'desc',
        },
      ],
    });
  }

  async create(createProductImageDto: CreateProductImageDto) {
    const product_id = createProductImageDto.product_id;

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

    const image = createProductImageDto.image.trim();

    if (!image) {
      throw new BadRequestException('Image path cannot be empty');
    }

    const isPrimary = createProductImageDto.is_primary ?? false;

    return this.prisma.$transaction(async (tx) => {
      if (isPrimary) {
        await tx.productImage.updateMany({
          where: {
            product_id,
          },
          data: {
            is_primary: false,
          },
        });
      }

      return tx.productImage.create({
        data: {
          product_id,
          image,
          is_primary: isPrimary,
        },
        include: {
          product: true,
        },
      });
    });
  }

  async update(image_id: number, updateProductImageDto: UpdateProductImageDto) {
    const image = await this.prisma.productImage.findUnique({
      where: {
        image_id,
      },
    });

    if (!image) {
      throw new NotFoundException(
        `Product image with ID ${image_id} not found`,
      );
    }

    const data: Prisma.ProductImageUpdateInput = {};

    if (updateProductImageDto.image !== undefined) {
      const newImage = updateProductImageDto.image.trim();

      if (!newImage) {
        throw new BadRequestException('Image path cannot be empty');
      }

      data.image = newImage;
    }

    if (updateProductImageDto.is_primary !== undefined) {
      const isPrimary = updateProductImageDto.is_primary;

      if (isPrimary && !image.is_primary) {
        return this.prisma.$transaction(async (tx) => {
          await tx.productImage.updateMany({
            where: {
              product_id: image.product_id,
            },
            data: {
              is_primary: false,
            },
          });

          return tx.productImage.update({
            where: {
              image_id,
            },
            data: {
              ...data,
              is_primary: true,
            },
            include: {
              product: true,
            },
          });
        });
      }

      data.is_primary = isPrimary;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields provided for update');
    }

    return this.prisma.productImage.update({
      where: {
        image_id,
      },
      data,
      include: {
        product: true,
      },
    });
  }

  async remove(image_id: number) {
    const image = await this.prisma.productImage.findUnique({
      where: {
        image_id,
      },
    });

    if (!image) {
      throw new NotFoundException(
        `Product image with ID ${image_id} not found`,
      );
    }

    return this.prisma.productImage.delete({
      where: {
        image_id,
      },
      include: {
        product: true,
      },
    });
  }
}
