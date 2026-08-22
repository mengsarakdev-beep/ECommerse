import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateOrderStatusHistoryDto {
  @IsInt()
  order_id!: number;

  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  note?: string | null;
}
