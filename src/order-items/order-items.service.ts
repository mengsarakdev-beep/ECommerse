import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderItemDto } from './dto/create-order-item.dto.js';
import { UpdateOrderItemDto } from './dto/update-order-item.dto.js';

@Injectable()
export class OrderItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.orderItem.findMany({
      include: {
        order: true,
        product: true,
      },
    });
  }

  async findById(order_item_id: number) {
    const item = await this.prisma.orderItem.findUnique({
      where: { order_item_id },
      include: {
        order: true,
        product: true,
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Order item with ID ${order_item_id} not found`,
      );
    }

    return item;
  }

  async findByOrderId(order_id: number) {
    return this.prisma.orderItem.findMany({
      where: { order_id },
      include: {
        order: true,
        product: true,
      },
    });
  }

  async create(createOrderItemDto: CreateOrderItemDto) {
    const order = await this.prisma.order.findUnique({
      where: { order_id: createOrderItemDto.order_id },
    });

    if (!order) {
      throw new NotFoundException(
        `Order with ID ${createOrderItemDto.order_id} not found`,
      );
    }

    const product = await this.prisma.product.findUnique({
      where: { product_id: createOrderItemDto.product_id },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${createOrderItemDto.product_id} not found`,
      );
    }

    const priceAsNumber =
      typeof product.price === 'number' ? product.price : Number(product.price);
    const subtotal = priceAsNumber * createOrderItemDto.quantity;

    return this.prisma.orderItem.create({
      data: {
        order_id: createOrderItemDto.order_id,
        product_id: createOrderItemDto.product_id,
        quantity: createOrderItemDto.quantity,
        price: priceAsNumber,
        subtotal,
      },
      include: {
        order: true,
        product: true,
      },
    });
  }

  async update(order_item_id: number, updateOrderItemDto: UpdateOrderItemDto) {
    const item = await this.findById(order_item_id);

    const quantity = Number(updateOrderItemDto.quantity ?? item.quantity);
    const priceAsNumber =
      typeof item.price === 'number' ? item.price : Number(item.price);
    const subtotal = priceAsNumber * quantity;

    return this.prisma.orderItem.update({
      where: { order_item_id },
      data: {
        quantity,
        subtotal,
      },
      include: {
        order: true,
        product: true,
      },
    });
  }

  async remove(order_item_id: number) {
    await this.findById(order_item_id);

    return this.prisma.orderItem.delete({
      where: { order_item_id },
      include: {
        order: true,
        product: true,
      },
    });
  }
}
