import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.payment.findMany({
      include: { order: true },
      orderBy: { created_at: 'desc' },
    });
  }

  findById(payment_id: number) {
    return this.prisma.payment.findUnique({
      where: { payment_id },
      include: { order: true },
    });
  }

  findByOrderId(order_id: number) {
    return this.prisma.payment.findMany({
      where: { order_id },
      include: { order: true },
      orderBy: { created_at: 'desc' },
    });
  }

  findOrderById(order_id: number) {
    return this.prisma.order.findUnique({ where: { order_id } });
  }

  create(data: Prisma.PaymentCreateInput) {
    return this.prisma.payment.create({
      data,
      include: { order: true },
    });
  }

  update(payment_id: number, data: Prisma.PaymentUpdateInput) {
    return this.prisma.payment.update({
      where: { payment_id },
      data,
      include: { order: true },
    });
  }

  remove(payment_id: number) {
    return this.prisma.payment.delete({
      where: { payment_id },
      include: { order: true },
    });
  }
}
