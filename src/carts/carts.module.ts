import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CartsController } from './carts.controller.js';
import { CartService } from './carts.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CartsController],
  providers: [CartService],
  exports: [CartService],
})
export class CartsModule {}
