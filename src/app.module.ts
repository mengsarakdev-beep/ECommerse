import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { CartsModule } from './carts/carts.module.js';
import { CartItemsModule } from './cart-items/cart-items.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { BrandsModule } from './brands/brands.module.js';
import { ProductsModule } from './products/products.module.js';
import { ProductDetailsModule } from './product-details/product-details.module.js';
import { ProductImagesModule } from './product-images/product-images.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { WishlistsModule } from './wishlists/wishlists.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { OrderItemsModule } from './order-items/order-items.module.js';
import { OrderStatusHistoryModule } from './order-status-history/order-status-history.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { AddressesModule } from './addresses/addresses.module.js';
import { AuthModule } from './auth/auth.module.js';
import { TelegramModule } from './telegram/telegram.module.js';
import { UploadsModule } from './uploads/uploads.module.js';

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
    CartItemsModule,
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
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
