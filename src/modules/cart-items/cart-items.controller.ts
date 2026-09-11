import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CartItemsService } from './cart-items.service.js';

import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/decorators/current-user.decorator.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('carts/me/items')
@UseGuards(JwtAuthGuard)
export class CartItemsController {
  constructor(private readonly cartItemsService: CartItemsService) {}

  /**
   * GET /carts/me/items
   *
   * Get all items belonging to the authenticated user's cart.
   */
  @Get()
  findMyCartItems(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.cartItemsService.findByUser(currentUser.user_id);
  }

  /**
   * GET /carts/me/items/:cartItemId
   *
   * Get one cart item belonging to the authenticated user.
   */
  @Get(':cartItemId')
  findById(
    @Param('cartItemId', ParseIntPipe) cartItemId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.cartItemsService.findById(currentUser.user_id, cartItemId);
  }

  /**
   * POST /carts/me/items
   *
   * Add a product to the authenticated user's cart.
   */
  @Post()
  addToCart(
    @Body() dto: AddCartItemDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.cartItemsService.addToCart(
      currentUser.user_id,
      dto.product_id,
      dto.quantity,
    );
  }

  /**
   * PATCH /carts/me/items/:cartItemId
   *
   * Update the quantity of a cart item.
   */
  @Patch(':cartItemId')
  updateQuantity(
    @Param('cartItemId', ParseIntPipe) cartItemId: number,
    @Body() dto: UpdateCartItemDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.cartItemsService.updateQuantity(
      currentUser.user_id,
      cartItemId,
      dto.quantity,
    );
  }

  /**
   * DELETE /carts/me/items/:cartItemId
   *
   * Remove a cart item belonging to the authenticated user.
   */
  @Delete(':cartItemId')
  remove(
    @Param('cartItemId', ParseIntPipe) cartItemId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.cartItemsService.remove(currentUser.user_id, cartItemId);
  }
}
