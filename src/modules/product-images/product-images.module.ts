import { Module } from '@nestjs/common';
import { ProductImagesController } from './product-images.controller.js';
import { ProductImagesService } from './product-images.service.js';
import { ProductImagesRepository } from './product-images.repository.js';

@Module({
  controllers: [ProductImagesController],
  providers: [ProductImagesService, ProductImagesRepository],
  exports: [ProductImagesService],
})
export class ProductImagesModule {}
