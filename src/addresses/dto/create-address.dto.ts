import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateAddressDto {
  @IsInt()
  @IsPositive()
  user_id!: number;

  @IsString()
  recipient_name!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  province?: string | null;

  @IsOptional()
  @IsString()
  district?: string | null;

  @IsOptional()
  @IsString()
  commune?: string | null;

  @IsOptional()
  @IsString()
  street?: string | null;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
