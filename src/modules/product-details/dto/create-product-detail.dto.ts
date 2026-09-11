import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ProductStatus } from '../../../../generated/prisma/enums.js';

export class CreateProductDetailDto {
  @IsInt()
  product_id!: number;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  color?: string | null;
}
