import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { UpdatePaymentDto } from './dto/update-payment.dto.js';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        order: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findById(payment_id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { payment_id },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${payment_id} not found`);
    }

    return payment;
  }

  async findByOrderId(order_id: number) {
    return this.prisma.payment.findMany({
      where: { order_id },
      include: { order: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async create(createPaymentDto: CreatePaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { order_id: createPaymentDto.order_id },
    });

    if (!order) {
      throw new NotFoundException(
        `Order with ID ${createPaymentDto.order_id} not found`,
      );
    }

    return this.prisma.payment.create({
      data: {
        order_id: createPaymentDto.order_id,
        method: createPaymentDto.method,
        amount: createPaymentDto.amount,
        transaction_id: createPaymentDto.transaction_id ?? null,
        status: 'PENDING',
      },
      include: { order: true },
    });
  }

  async update(payment_id: number, updatePaymentDto: UpdatePaymentDto) {
    const payment = await this.findById(payment_id);

    return this.prisma.payment.update({
      where: { payment_id },
      data: {
        method: updatePaymentDto.method ?? payment.method,
        amount: updatePaymentDto.amount ?? payment.amount,
        transaction_id:
          updatePaymentDto.transaction_id ?? payment.transaction_id,
      },
      include: { order: true },
    });
  }

  async updateStatus(payment_id: number, status: string, paid_at?: Date) {
    await this.findById(payment_id);

    return this.prisma.payment.update({
      where: { payment_id },
      data: {
        status,
        paid_at: status === 'PAID' ? (paid_at ?? new Date()) : null,
      },
      include: { order: true },
    });
  }

  async remove(payment_id: number) {
    await this.findById(payment_id);

    return this.prisma.payment.delete({
      where: { payment_id },
      include: { order: true },
    });
  }
}
