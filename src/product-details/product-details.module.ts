import { Module } from '@nestjs/common';
import { ProductDetailsController } from './product-details.controller.js';
import { ProductDetailsService } from './product-details.service.js';

@Module({
  controllers: [ProductDetailsController],
  providers: [ProductDetailsService],
  exports: [ProductDetailsService],
})
export class ProductDetailsModule {}
