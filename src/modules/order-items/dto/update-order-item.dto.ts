import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderItemDto } from './create-order-item.dto.js';

export class UpdateOrderItemDto extends PartialType(CreateOrderItemDto) {}
