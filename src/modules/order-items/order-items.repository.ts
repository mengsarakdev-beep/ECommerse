import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class OrderItemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.orderItem.findMany({
      include: { order: true, product: true },
    });
  }

  findById(order_item_id: number) {
    return this.prisma.orderItem.findUnique({
      where: { order_item_id },
      include: { order: true, product: true },
    });
  }

  findByOrderId(order_id: number) {
    return this.prisma.orderItem.findMany({
      where: { order_id },
      include: { order: true, product: true },
    });
  }

  findOrderById(order_id: number) {
    return this.prisma.order.findUnique({ where: { order_id } });
  }

  findProductById(product_id: number) {
    return this.prisma.product.findUnique({ where: { product_id } });
  }

  create(data: {
    order_id: number;
    product_id: number;
    quantity: number;
    price: number;
    subtotal: number;
  }) {
    return this.prisma.orderItem.create({
      data,
      include: { order: true, product: true },
    });
  }

  update(order_item_id: number, quantity: number, subtotal: number) {
    return this.prisma.orderItem.update({
      where: { order_item_id },
      data: { quantity, subtotal },
      include: { order: true, product: true },
    });
  }

  remove(order_item_id: number) {
    return this.prisma.orderItem.delete({
      where: { order_item_id },
      include: { order: true, product: true },
    });
  }
}
