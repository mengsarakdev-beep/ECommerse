import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewsRepository } from './reviews.repository.js';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
  ) {}

  async findAll() {
    return this.reviewsRepository.findAll();
  }

  async findById(review_id: number) {
    const review = await this.reviewsRepository.findById(review_id);

    if (!review) {
      throw new NotFoundException(`Review with ID ${review_id} not found`);
    }

    return review;
  }

  async create(data: { user_id: number; product_id: number; rating: number }) {
    const user = await this.reviewsRepository.findUserById(data.user_id);
    const product = await this.reviewsRepository.findProductById(
      data.product_id,
    );

    if (!user)
      throw new NotFoundException(`User with ID ${data.user_id} not found`);
    if (!product)
      throw new NotFoundException(
        `Product with ID ${data.product_id} not found`,
      );

    const existing = await this.reviewsRepository.findExisting(
      data.user_id,
      data.product_id,
    );

    if (existing) {
      throw new BadRequestException('User has already reviewed this product');
    }

    return this.reviewsRepository.create({
      user_id: data.user_id,
      product_id: data.product_id,
      rating: data.rating,
    });
  }

  async update(review_id: number, rating: number) {
    await this.findById(review_id);

    return this.reviewsRepository.update(review_id, rating);
  }

  async remove(review_id: number) {
    await this.findById(review_id);

    return this.reviewsRepository.remove(review_id);
  }
}
