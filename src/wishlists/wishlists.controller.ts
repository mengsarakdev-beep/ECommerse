import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { WishlistsService } from './wishlists.service.js';

@Controller('wishlists')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Get()
  async findAll() {
    return await this.wishlistsService.findAll();
  }

  @Get('user/:user_id')
  async findByUser(@Param('user_id', ParseIntPipe) user_id: number) {
    return await this.wishlistsService.findByUser(user_id);
  }

  @Post('user/:user_id')
  @HttpCode(HttpStatus.CREATED)
  async add(
    @Param('user_id', ParseIntPipe) user_id: number,
    @Body() data: { product_id: number },
  ) {
    return await this.wishlistsService.add(user_id, data.product_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.wishlistsService.remove(id);
  }
}
