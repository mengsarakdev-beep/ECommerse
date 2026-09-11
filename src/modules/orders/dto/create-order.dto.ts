import { IsArray, IsInt, IsOptional, IsPositive } from 'class-validator';

export class CreateOrderDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
  user_id!: number;

  @IsInt()
  @IsPositive()
  address_id!: number;

  @IsArray()
  items!: Array<{
    product_id: number;
    quantity: number;
  }>;
}
