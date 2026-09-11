import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client.js';

import { CreateProductImageDto } from './dto/create-product-image.dto.js';
import { UpdateProductImageDto } from './dto/update-product-image.dto.js';
import { ProductImagesRepository } from './product-images.repository.js';

@Injectable()
export class ProductImagesService {
  constructor(
    private readonly productImagesRepository: ProductImagesRepository,
  ) {}

  async findAll() {
    return this.productImagesRepository.findAll();
  }

  async findById(image_id: number) {
    const image = await this.productImagesRepository.findById(image_id);

    if (!image) {
      throw new NotFoundException(
        `Product image with ID ${image_id} not found`,
      );
    }

    return image;
  }

  async findByProductId(product_id: number) {
    const product =
      await this.productImagesRepository.findProductById(product_id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found`);
    }

    return this.productImagesRepository.findByProductId(product_id);
  }

  async create(createProductImageDto: CreateProductImageDto) {
    const product_id = createProductImageDto.product_id;

    const product =
      await this.productImagesRepository.findProductById(product_id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found`);
    }

    const image = createProductImageDto.image.trim();

    if (!image) {
      throw new BadRequestException('Image path cannot be empty');
    }

    const isPrimary = createProductImageDto.is_primary ?? false;

    return this.productImagesRepository.create({
      product_id,
      image,
      is_primary: isPrimary,
    });
  }

  async update(image_id: number, updateProductImageDto: UpdateProductImageDto) {
    const image = await this.productImagesRepository.findById(image_id);

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
        return this.productImagesRepository.updateAsPrimary(
          image_id,
          image.product_id,
          data,
        );
      }

      data.is_primary = isPrimary;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields provided for update');
    }

    return this.productImagesRepository.update(image_id, data);
  }

  async remove(image_id: number) {
    const image = await this.productImagesRepository.findById(image_id);

    if (!image) {
      throw new NotFoundException(
        `Product image with ID ${image_id} not found`,
      );
    }

    return this.productImagesRepository.remove(image_id);
  }
}
