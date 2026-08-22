import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CartItemsController } from './cart-items.controller.js';
import { CartItemsService } from './cart-items.service.js';

@Module({
  imports: [AuthModule],

  controllers: [CartItemsController],

  providers: [CartItemsService],

  exports: [CartItemsService],
})
export class CartItemsModule {}
