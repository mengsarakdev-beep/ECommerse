import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderStatusHistoryDto } from './dto/create-order-status-history.dto.js';

@Injectable()
export class OrderStatusHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.orderStatusHistory.findMany({
      include: {
        order: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findById(history_id: number) {
    const history = await this.prisma.orderStatusHistory.findUnique({
      where: { history_id },
      include: { order: true },
    });

    if (!history) {
      throw new NotFoundException(
        `Order status history with ID ${history_id} not found`,
      );
    }

    return history;
  }

  async findByOrderId(order_id: number) {
    return this.prisma.orderStatusHistory.findMany({
      where: { order_id },
      include: { order: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async create(createOrderStatusHistoryDto: CreateOrderStatusHistoryDto) {
    const order = await this.prisma.order.findUnique({
      where: { order_id: createOrderStatusHistoryDto.order_id },
    });

    if (!order) {
      throw new NotFoundException(
        `Order with ID ${createOrderStatusHistoryDto.order_id} not found`,
      );
    }

    return this.prisma.orderStatusHistory.create({
      data: {
        order_id: createOrderStatusHistoryDto.order_id,
        status: createOrderStatusHistoryDto.status,
        note: createOrderStatusHistoryDto.note ?? null,
      },
      include: { order: true },
    });
  }
}
