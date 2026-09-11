import { IsInt, IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  @IsOptional()
  @IsString()
  fieldname?: string;

  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsString()
  originalname?: string;

  @IsOptional()
  @IsString()
  mimetype?: string;

  @IsOptional()
  @IsInt()
  size?: number;
}

export class UploadProductImageDto {
  @IsInt()
  product_id!: number;

  @IsString()
  image!: string;

  @IsOptional()
  is_primary?: boolean;
}
