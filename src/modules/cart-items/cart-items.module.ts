import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CartItemsController } from './cart-items.controller.js';
import { CartItemsService } from './cart-items.service.js';
import { CartItemsRepository } from './cart-items.repository.js';

@Module({
  imports: [AuthModule],

  controllers: [CartItemsController],

  providers: [CartItemsService, CartItemsRepository],

  exports: [CartItemsService],
})
export class CartItemsModule {}
