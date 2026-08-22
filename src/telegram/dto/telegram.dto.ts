import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString()
  message!: string;

  @IsInt()
  chatId!: number;

  @IsOptional()
  @IsString()
  parseMode?: 'HTML' | 'Markdown';
}

export class SendOrderNotificationDto {
  @IsInt()
  orderId!: number;

  @IsInt()
  userId!: number;

  @IsOptional()
  @IsNumber()
  userChatId?: number;

  @IsString()
  status!: string;

  @IsNumber()
  totalPrice!: number;

  @IsInt()
  itemCount!: number;
}
