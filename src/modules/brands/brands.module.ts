import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { BrandsController } from './brands.controller.js';
import { BrandsService } from './brands.service.js';
import { BrandsRepository } from './brands.repository.js';

@Module({
  imports: [PrismaModule],
  controllers: [BrandsController],
  providers: [BrandsService, BrandsRepository],
  exports: [BrandsService],
})
export class BrandsModule {}
