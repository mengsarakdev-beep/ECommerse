import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateProductImageDto {
  @IsInt()
  product_id!: number;

  @IsString()
  image!: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}
