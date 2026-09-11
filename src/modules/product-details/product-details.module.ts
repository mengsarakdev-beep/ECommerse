import { Module } from '@nestjs/common';
import { ProductDetailsController } from './product-details.controller.js';
import { ProductDetailsService } from './product-details.service.js';
import { ProductDetailsRepository } from './product-details.repository.js';

@Module({
  controllers: [ProductDetailsController],
  providers: [ProductDetailsService, ProductDetailsRepository],
  exports: [ProductDetailsService],
})
export class ProductDetailsModule {}
