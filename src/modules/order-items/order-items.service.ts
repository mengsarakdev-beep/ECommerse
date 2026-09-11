import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderItemsRepository } from './order-items.repository.js';
import { CreateOrderItemDto } from './dto/create-order-item.dto.js';
import { UpdateOrderItemDto } from './dto/update-order-item.dto.js';

@Injectable()
export class OrderItemsService {
  constructor(private readonly orderItemsRepository: OrderItemsRepository) {}

  async findAll() {
    return this.orderItemsRepository.findAll();
  }

  async findById(order_item_id: number) {
    const item = await this.orderItemsRepository.findById(order_item_id);

    if (!item) {
      throw new NotFoundException(
        `Order item with ID ${order_item_id} not found`,
      );
    }

    return item;
  }

  async findByOrderId(order_id: number) {
    return this.orderItemsRepository.findByOrderId(order_id);
  }

  async create(createOrderItemDto: CreateOrderItemDto) {
    const order = await this.orderItemsRepository.findOrderById(
      createOrderItemDto.order_id,
    );

    if (!order) {
      throw new NotFoundException(
        `Order with ID ${createOrderItemDto.order_id} not found`,
      );
    }

    const product = await this.orderItemsRepository.findProductById(
      createOrderItemDto.product_id,
    );

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${createOrderItemDto.product_id} not found`,
      );
    }

    const priceAsNumber =
      typeof product.price === 'number' ? product.price : Number(product.price);
    const subtotal = priceAsNumber * createOrderItemDto.quantity;

    return this.orderItemsRepository.create({
      order_id: createOrderItemDto.order_id,
      product_id: createOrderItemDto.product_id,
      quantity: createOrderItemDto.quantity,
      price: priceAsNumber,
      subtotal,
    });
  }

  async update(order_item_id: number, updateOrderItemDto: UpdateOrderItemDto) {
    const item = await this.findById(order_item_id);

    const quantity = Number(updateOrderItemDto.quantity ?? item.quantity);
    const priceAsNumber =
      typeof item.price === 'number' ? item.price : Number(item.price);
    const subtotal = priceAsNumber * quantity;

    return this.orderItemsRepository.update(order_item_id, quantity, subtotal);
  }

  async remove(order_item_id: number) {
    await this.findById(order_item_id);

    return this.orderItemsRepository.remove(order_item_id);
  }
}
