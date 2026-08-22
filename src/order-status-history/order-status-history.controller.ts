import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreateOrderStatusHistoryDto } from './dto/create-order-status-history.dto.js';
import { OrderStatusHistoryService } from './order-status-history.service.js';

@Controller('order-status-history')
export class OrderStatusHistoryController {
  constructor(
    private readonly orderStatusHistoryService: OrderStatusHistoryService,
  ) {}

  @Get()
  async findAll() {
    return await this.orderStatusHistoryService.findAll();
  }

  @Get('order/:orderId')
  async findByOrderId(@Param('orderId', ParseIntPipe) orderId: number) {
    return await this.orderStatusHistoryService.findByOrderId(orderId);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return await this.orderStatusHistoryService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createOrderStatusHistoryDto: CreateOrderStatusHistoryDto,
  ) {
    return await this.orderStatusHistoryService.create(
      createOrderStatusHistoryDto,
    );
  }
}
