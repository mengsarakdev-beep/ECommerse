import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const orderInclude = {
  user: true,
  address: true,
  items: { include: { product: true } },
  payments: true,
  status_history: true,
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.order.findMany({
      include: orderInclude,
      orderBy: { order_date: 'desc' },
    });
  }

  findById(order_id: number) {
    return this.prisma.order.findUnique({
      where: { order_id },
      include: orderInclude,
    });
  }

  findByUserId(user_id: number) {
    return this.prisma.order.findMany({
      where: { user_id },
      include: orderInclude,
      orderBy: { order_date: 'desc' },
    });
  }

  findUserById(user_id: number) {
    return this.prisma.user.findUnique({
      where: { user_id },
    });
  }

  findAddressById(address_id: number) {
    return this.prisma.address.findUnique({
      where: { address_id },
    });
  }

  findProductById(product_id: number) {
    return this.prisma.product.findUnique({
      where: { product_id },
    });
  }

  create(data: Prisma.OrderUncheckedCreateInput) {
    return this.prisma.order.create({
      data,
      include: orderInclude,
    });
  }

  updateStatus(order_id: number, status: string) {
    return this.prisma.order.update({
      where: { order_id },
      data: {
        status,
        status_history: {
          create: {
            status,
          },
        },
      },
      include: orderInclude,
    });
  }
}
