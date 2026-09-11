import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WishlistsRepository } from './wishlists.repository.js';

@Injectable()
export class WishlistsService {
  constructor(private readonly wishlistsRepository: WishlistsRepository) {}

  async findAll() {
    return this.wishlistsRepository.findAll();
  }

  async findByUser(user_id: number) {
    return this.wishlistsRepository.findByUser(user_id);
  }

  async add(user_id: number, product_id: number) {
    const user = await this.wishlistsRepository.findUserById(user_id);
    const product = await this.wishlistsRepository.findProductById(product_id);

    if (!user) throw new NotFoundException(`User with ID ${user_id} not found`);
    if (!product)
      throw new NotFoundException(`Product with ID ${product_id} not found`);

    const existing = await this.wishlistsRepository.findExisting(
      user_id,
      product_id,
    );

    if (existing) {
      throw new BadRequestException('Product is already in the wishlist');
    }

    return this.wishlistsRepository.create({ user_id, product_id });
  }

  async remove(wishlist_id: number) {
    const item = await this.wishlistsRepository.findById(wishlist_id);

    if (!item) {
      throw new NotFoundException(
        `Wishlist item with ID ${wishlist_id} not found`,
      );
    }

    return this.wishlistsRepository.remove(wishlist_id);
  }
}
