import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatusHistoryRepository } from './order-status-history.repository.js';
import { CreateOrderStatusHistoryDto } from './dto/create-order-status-history.dto.js';

@Injectable()
export class OrderStatusHistoryService {
  constructor(
    private readonly orderStatusHistoryRepository: OrderStatusHistoryRepository,
  ) {}

  findAll() {
    return this.orderStatusHistoryRepository.findAll();
  }

  async findById(history_id: number) {
    const history =
      await this.orderStatusHistoryRepository.findById(history_id);

    if (!history) {
      throw new NotFoundException(
        `Order status history with ID ${history_id} not found`,
      );
    }

    return history;
  }

  findByOrderId(order_id: number) {
    return this.orderStatusHistoryRepository.findByOrderId(order_id);
  }

  async create(createOrderStatusHistoryDto: CreateOrderStatusHistoryDto) {
    const order = await this.orderStatusHistoryRepository.findOrderById(
      createOrderStatusHistoryDto.order_id,
    );

    if (!order) {
      throw new NotFoundException(
        `Order with ID ${createOrderStatusHistoryDto.order_id} not found`,
      );
    }

    return this.orderStatusHistoryRepository.create({
      order_id: createOrderStatusHistoryDto.order_id,
      status: createOrderStatusHistoryDto.status,
      note: createOrderStatusHistoryDto.note ?? null,
    });
  }
}
