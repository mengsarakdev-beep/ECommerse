import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { OrderItemsController } from './order-items.controller.js';
import { OrderItemsService } from './order-items.service.js';
import { OrderItemsRepository } from './order-items.repository.js';

@Module({
  imports: [PrismaModule],
  controllers: [OrderItemsController],
  providers: [OrderItemsService, OrderItemsRepository],
  exports: [OrderItemsService],
})
export class OrderItemsModule {}
