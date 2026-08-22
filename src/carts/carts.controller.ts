import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CartService } from './carts.service.js';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/decorators/current-user.decorator.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('carts')
@UseGuards(JwtAuthGuard)
export class CartsController {
  constructor(private readonly cartsService: CartService) {}

  // ============================================================
  // GET MY CART
  // GET /carts/me
  // ============================================================

  @Get('me')
  getMyCart(
    @CurrentUser()
    currentUser: AuthenticatedUser,
  ) {
    return this.cartsService.findByUser(currentUser.user_id);
  }

  // ============================================================
  // CREATE MY CART
  // POST /carts/me
  // ============================================================

  @Post('me')
  @HttpCode(HttpStatus.CREATED)
  createMyCart(
    @CurrentUser()
    currentUser: AuthenticatedUser,
  ) {
    return this.cartsService.createForUser(currentUser.user_id);
  }
}
