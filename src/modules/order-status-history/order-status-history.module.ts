import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { OrderStatusHistoryController } from './order-status-history.controller.js';
import { OrderStatusHistoryService } from './order-status-history.service.js';
import { OrderStatusHistoryRepository } from './order-status-history.repository.js';

@Module({
  imports: [PrismaModule],
  controllers: [OrderStatusHistoryController],
  providers: [OrderStatusHistoryService, OrderStatusHistoryRepository],
  exports: [OrderStatusHistoryService],
})
export class OrderStatusHistoryModule {}
