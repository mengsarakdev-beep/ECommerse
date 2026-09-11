import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { CartsModule } from './modules/carts/carts.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { BrandsModule } from './modules/brands/brands.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { ProductDetailsModule } from './modules/product-details/product-details.module.js';
import { ProductImagesModule } from './modules/product-images/product-images.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { WishlistsModule } from './modules/wishlists/wishlists.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { OrderItemsModule } from './modules/order-items/order-items.module.js';
import { OrderStatusHistoryModule } from './modules/order-status-history/order-status-history.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { AddressesModule } from './modules/addresses/addresses.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { TelegramModule } from './modules/telegram/telegram.module.js';
import { UploadsModule } from './modules/uploads/uploads.module.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests
      },
      {
        name: 'long',
        ttl: 900000, // 15 minutes
        limit: 100, // 100 requests
      },
    ]),
    PrismaModule,
    UsersModule,
    CartsModule,
    CategoriesModule,
    BrandsModule,
    ProductsModule,
    ProductDetailsModule,
    ProductImagesModule,
    ReviewsModule,
    WishlistsModule,
    OrdersModule,
    OrderItemsModule,
    OrderStatusHistoryModule,
    PaymentsModule,
    AddressesModule,
    AuthModule,
    TelegramModule,
    UploadsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('{*path}');
  }
}
