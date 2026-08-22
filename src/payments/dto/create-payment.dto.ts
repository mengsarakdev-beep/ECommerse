import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsInt()
  @IsPositive()
  order_id!: number;

  @IsString()
  method!: string;

  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsString()
  transaction_id?: string | null;
}
