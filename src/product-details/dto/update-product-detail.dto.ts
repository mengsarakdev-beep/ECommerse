import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateProductDetailDto } from './create-product-detail.dto.js';

export class UpdateProductDetailDto extends PartialType(
  OmitType(CreateProductDetailDto, ['product_id'] as const),
) {}
