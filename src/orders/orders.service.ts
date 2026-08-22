import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TelegramService } from '../telegram/telegram.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  private serializeOrder<
    T extends {
      user?: {
        telegram_chat_id?: number | bigint | null;
        [key: string]: unknown;
      } | null;
      total_amount?: unknown;
    },
  >(order: T) {
    if (!order) {
      return order;
    }

    const serializedUser = order.user
      ? {
          ...order.user,
          telegram_chat_id:
            order.user.telegram_chat_id === null ||
            order.user.telegram_chat_id === undefined
              ? null
              : Number(order.user.telegram_chat_id),
        }
      : null;

    return {
      ...order,
      total_amount:
        order.total_amount === null || order.total_amount === undefined
          ? null
          : Number(order.total_amount),
      user: serializedUser,
    };
  }

  async findAll() {
    const orders = await this.prisma.order.findMany({
      include: {
        user: true,
        address: true,
        items: { include: { product: true } },
        payments: true,
        status_history: true,
      },
      orderBy: {
        order_date: 'desc',
      },
    });

    return orders.map((order) => this.serializeOrder(order));
  }

  async findById(order_id: number) {
    const order = await this.prisma.order.findUnique({
      where: { order_id },
      include: {
        user: true,
        address: true,
        items: { include: { product: true } },
        payments: true,
        status_history: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${order_id} not found`);
    }

    return this.serializeOrder(order);
  }

  async findByUserId(user_id: number) {
    const orders = await this.prisma.order.findMany({
      where: { user_id },
      include: {
        user: true,
        address: true,
        items: { include: { product: true } },
        payments: true,
        status_history: true,
      },
      orderBy: {
        order_date: 'desc',
      },
    });

    return orders.map((order) => this.serializeOrder(order));
  }

  async create(createOrderDto: CreateOrderDto) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: createOrderDto.user_id },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createOrderDto.user_id} not found`,
      );
    }

    const address = await this.prisma.address.findUnique({
      where: { address_id: createOrderDto.address_id },
    });

    if (!address) {
      throw new NotFoundException(
        `Address with ID ${createOrderDto.address_id} not found`,
      );
    }

    let totalAmount = 0;
    const orderItems: any[] = [];

    for (const item of createOrderDto.items) {
      const product = await this.prisma.product.findUnique({
        where: { product_id: item.product_id },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.product_id} not found`,
        );
      }

      const priceAsNumber =
        typeof product.price === 'number'
          ? product.price
          : Number(product.price);
      const subtotal = priceAsNumber * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: priceAsNumber,
        subtotal,
      });
    }

    const order = await this.prisma.order.create({
      data: {
        user_id: createOrderDto.user_id,
        address_id: createOrderDto.address_id,
        total_amount: totalAmount,
        status: 'PENDING',
        items: {
          create: orderItems,
        },
        status_history: {
          create: {
            status: 'PENDING',
            note: 'Order created',
          },
        },
      },
      include: {
        user: true,
        address: true,
        items: { include: { product: true } },
        payments: true,
        status_history: true,
      },
    });

    const safeOrder = this.serializeOrder(order);

    // Send Telegram notification for new order
    const userWithTelegram = order.user as unknown as {
      telegram_chat_id?: number | bigint;
    };
    if (userWithTelegram?.telegram_chat_id) {
      await this.telegramService
        .sendNewOrderConfirmation({
          orderId: order.order_id,
          userId: order.user_id,
          userChatId: Number(userWithTelegram.telegram_chat_id),
          status: order.status,
          totalPrice: Number(order.total_amount),
          itemCount: orderItems.length,
        })
        .catch((err) => {
          console.error(
            `Failed to send Telegram notification for order ${order.order_id}`,
            err,
          );
        });
    }

    return safeOrder;
  }

  async updateStatus(
    order_id: number,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    await this.findById(order_id);

    const updatedOrder = await this.prisma.order.update({
      where: { order_id },
      data: {
        status: updateOrderStatusDto.status,
        status_history: {
          create: {
            status: updateOrderStatusDto.status,
          },
        },
      },
      include: {
        user: true,
        address: true,
        items: { include: { product: true } },
        payments: true,
        status_history: true,
      },
    });

    const safeOrder = this.serializeOrder(updatedOrder);

    // Send Telegram notification for status update
    const userWithTelegram = updatedOrder.user as unknown as {
      telegram_chat_id?: number | bigint;
    };
    if (userWithTelegram?.telegram_chat_id) {
      await this.telegramService
        .sendOrderNotification({
          orderId: updatedOrder.order_id,
          userId: updatedOrder.user_id,
          userChatId: Number(userWithTelegram.telegram_chat_id),
          status: updatedOrder.status,
          totalPrice: Number(updatedOrder.total_amount),
          itemCount: updatedOrder.items.length,
        })
        .catch((err) => {
          console.error(
            `Failed to send Telegram notification for order ${updatedOrder.order_id}`,
            err,
          );
        });
    }

    return safeOrder;
  }
}
