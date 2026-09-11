import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CartsRepository } from './carts.repository.js';

@Injectable()
export class CartService {
  constructor(private readonly cartsRepository: CartsRepository) {}

  // ============================================================
  // GET MY CART
  // ============================================================

  async findByUser(user_id: number) {
    this.validateId(user_id, 'User ID');

    const cart = await this.cartsRepository.findByUser(user_id);

    if (!cart) {
      throw new NotFoundException(`Cart for user ${user_id} not found`);
    }

    return cart;
  }

  // ============================================================
  // CREATE MY CART
  // ============================================================

  async createForUser(user_id: number) {
    this.validateId(user_id, 'User ID');

    await this.ensureUserExists(user_id);

    return this.cartsRepository.upsertForUser(user_id);
  }

  // ============================================================
  // GET OR CREATE MY CART
  // ============================================================

  async getOrCreateForUser(user_id: number) {
    this.validateId(user_id, 'User ID');

    await this.ensureUserExists(user_id);

    return this.cartsRepository.upsertForUser(user_id);
  }

  // ============================================================
  // CHECK USER
  // ============================================================

  private async ensureUserExists(user_id: number): Promise<void> {
    const user = await this.cartsRepository.findUserById(user_id);

    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }
  }

  // ============================================================
  // VALIDATE ID
  // ============================================================

  private validateId(value: number, fieldName: string): void {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new BadRequestException(`${fieldName} must be a positive integer`);
    }
  }
}
