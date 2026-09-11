import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { CartsController } from './carts.controller.js';
import { CartService } from './carts.service.js';
import { CartsRepository } from './carts.repository.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CartsController],
  providers: [CartService, CartsRepository],
  exports: [CartService],
})
export class CartsModule {}
