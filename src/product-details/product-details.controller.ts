import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateProductDetailDto } from './dto/create-product-detail.dto.js';
import { UpdateProductDetailDto } from './dto/update-product-detail.dto.js';
import { ProductDetailsService } from './product-details.service.js';

@Controller('product-details')
export class ProductDetailsController {
  constructor(private readonly productDetailsService: ProductDetailsService) {}

  @Get()
  findAll() {
    return this.productDetailsService.findAll();
  }

  @Get('product/:productId')
  findByProductId(@Param('productId', ParseIntPipe) productId: number) {
    return this.productDetailsService.findByProductId(productId);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.productDetailsService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body()
    createProductDetailDto: CreateProductDetailDto,
  ) {
    return this.productDetailsService.create(createProductDetailDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    updateProductDetailDto: UpdateProductDetailDto,
  ) {
    return this.productDetailsService.update(id, updateProductDetailDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.productDetailsService.remove(id);
  }
}
