import { IsInt, IsPositive } from 'class-validator';

export class CreateOrderItemDto {
  @IsInt()
  @IsPositive()
  order_id!: number;

  @IsInt()
  @IsPositive()
  product_id!: number;

  @IsInt()
  @IsPositive()
  quantity!: number;
}
