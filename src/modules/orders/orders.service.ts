import { Injectable, NotFoundException } from '@nestjs/common';
import { TelegramService } from '../telegram/telegram.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrderMapper } from './order.mapper.js';
import { OrdersRepository } from './orders.repository.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly telegramService: TelegramService,
  ) {}

  async findAll() {
    const orders = await this.ordersRepository.findAll();

    return OrderMapper.toResponses(orders);
  }

  async findById(order_id: number) {
    const order = await this.ordersRepository.findById(order_id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${order_id} not found`);
    }

    return OrderMapper.toResponse(order);
  }

  async findByUserId(user_id: number) {
    const orders = await this.ordersRepository.findByUserId(user_id);

    return OrderMapper.toResponses(orders);
  }

  async create(createOrderDto: CreateOrderDto, user_id: number) {
    const user = await this.ordersRepository.findUserById(user_id);

    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    const address = await this.ordersRepository.findAddressById(
      createOrderDto.address_id,
    );

    if (!address) {
      throw new NotFoundException(
        `Address with ID ${createOrderDto.address_id} not found`,
      );
    }
    if (address.user_id !== user_id) {
      throw new NotFoundException(
        `Address with ID ${createOrderDto.address_id} not found`,
      );
    }

    let totalAmount = 0;
    const orderItems: any[] = [];

    for (const item of createOrderDto.items) {
      const product = await this.ordersRepository.findProductById(
        item.product_id,
      );

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

    const order = await this.ordersRepository.create({
      user_id,
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
    });

    const safeOrder = OrderMapper.toResponse(order);

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

    const updatedOrder = await this.ordersRepository.updateStatus(
      order_id,
      updateOrderStatusDto.status,
    );

    const safeOrder = OrderMapper.toResponse(updatedOrder);

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
