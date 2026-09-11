import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { UpdatePaymentDto } from './dto/update-payment.dto.js';
import { PaymentMapper } from './payment.mapper.js';
import { PaymentsRepository } from './payments.repository.js';

@Injectable()
export class PaymentsService {
  constructor(private readonly paymentsRepository: PaymentsRepository) {}

  async findAll() {
    const payments = await this.paymentsRepository.findAll();

    return PaymentMapper.toResponses(payments);
  }

  async findById(payment_id: number) {
    const payment = await this.paymentsRepository.findById(payment_id);

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${payment_id} not found`);
    }

    return PaymentMapper.toResponse(payment);
  }

  async findByOrderId(order_id: number) {
    const payments = await this.paymentsRepository.findByOrderId(order_id);

    return PaymentMapper.toResponses(payments);
  }

  async create(createPaymentDto: CreatePaymentDto) {
    const order = await this.paymentsRepository.findOrderById(
      createPaymentDto.order_id,
    );

    if (!order) {
      throw new NotFoundException(
        `Order with ID ${createPaymentDto.order_id} not found`,
      );
    }

    const payment = await this.paymentsRepository.create({
      order: { connect: { order_id: createPaymentDto.order_id } },
      method: createPaymentDto.method,
      amount: createPaymentDto.amount,
      transaction_id: createPaymentDto.transaction_id ?? null,
      status: 'PENDING',
    });

    return PaymentMapper.toResponse(payment);
  }

  async update(payment_id: number, updatePaymentDto: UpdatePaymentDto) {
    const payment = await this.findById(payment_id);

    const updatedPayment = await this.paymentsRepository.update(payment_id, {
      method: updatePaymentDto.method ?? payment.method,
      amount: updatePaymentDto.amount ?? payment.amount,
      transaction_id:
        updatePaymentDto.transaction_id ?? payment.transaction_id,
    });

    return PaymentMapper.toResponse(updatedPayment);
  }

  async updateStatus(payment_id: number, status: string, paid_at?: Date) {
    await this.findById(payment_id);

    const updatedPayment = await this.paymentsRepository.update(payment_id, {
      status,
      paid_at: status === 'PAID' ? (paid_at ?? new Date()) : null,
    });

    return PaymentMapper.toResponse(updatedPayment);
  }

  async remove(payment_id: number) {
    await this.findById(payment_id);

    const payment = await this.paymentsRepository.remove(payment_id);

    return PaymentMapper.toResponse(payment);
  }
}
