import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsInt()
  @IsPositive()
  category_id!: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  brand_id?: number | null;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @IsPositive()
  original_price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_percent?: number;

  @IsNumber()
  @IsPositive()
  price!: number;
}
