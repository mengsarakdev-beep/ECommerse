import { IsInt, IsPositive } from 'class-validator';

export class AddCartItemDto {
  @IsInt()
  @IsPositive()
  product_id!: number;

  @IsInt()
  @IsPositive()
  quantity!: number;
}
