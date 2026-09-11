import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class OrderStatusHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.orderStatusHistory.findMany({
      include: { order: true },
      orderBy: { created_at: 'desc' },
    });
  }

  findById(history_id: number) {
    return this.prisma.orderStatusHistory.findUnique({
      where: { history_id },
      include: { order: true },
    });
  }

  findByOrderId(order_id: number) {
    return this.prisma.orderStatusHistory.findMany({
      where: { order_id },
      include: { order: true },
      orderBy: { created_at: 'desc' },
    });
  }

  findOrderById(order_id: number) {
    return this.prisma.order.findUnique({ where: { order_id } });
  }

  create(data: { order_id: number; status: string; note: string | null }) {
    return this.prisma.orderStatusHistory.create({
      data,
      include: { order: true },
    });
  }
}
