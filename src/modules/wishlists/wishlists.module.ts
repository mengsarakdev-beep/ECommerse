import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { WishlistsController } from './wishlists.controller.js';
import { WishlistsService } from './wishlists.service.js';
import { WishlistsRepository } from './wishlists.repository.js';

@Module({
  imports: [PrismaModule],
  controllers: [WishlistsController],
  providers: [WishlistsService, WishlistsRepository],
  exports: [WishlistsService],
})
export class WishlistsModule {}
