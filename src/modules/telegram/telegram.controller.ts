import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  SendMessageDto,
  SendOrderNotificationDto,
} from './dto/telegram.dto.js';
import { TelegramService } from './telegram.service.js';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  /**
   * Health check endpoint
   */
  @Get('health')
  async health() {
    const isVerified = await this.telegramService.verifyBotToken();
    return {
      status: isVerified ? 'connected' : 'disconnected',
      timestamp: new Date(),
    };
  }

  /**
   * Send a custom message
   */
  @Post('send-message')
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body() notification: SendMessageDto) {
    const success = await this.telegramService.sendMessage({
      chatId: notification.chatId,
      message: notification.message,
      parseMode: notification.parseMode,
    });
    return {
      success,
      message: success ? 'Message sent successfully' : 'Failed to send message',
    };
  }

  /**
   * Send order status notification
   */
  @Post('send-order-notification')
  @HttpCode(HttpStatus.OK)
  async sendOrderNotification(
    @Body() orderNotification: SendOrderNotificationDto,
  ) {
    const success = await this.telegramService.sendOrderNotification({
      orderId: orderNotification.orderId,
      userId: orderNotification.userId,
      userChatId: orderNotification.userChatId,
      status: orderNotification.status,
      totalPrice: orderNotification.totalPrice,
      itemCount: orderNotification.itemCount,
    });
    return {
      success,
      message: success
        ? 'Order notification sent successfully'
        : 'Failed to send order notification',
    };
  }

  /**
   * Send new order confirmation
   */
  @Post('send-new-order')
  @HttpCode(HttpStatus.OK)
  async sendNewOrderConfirmation(
    @Body() orderNotification: SendOrderNotificationDto,
  ) {
    const success = await this.telegramService.sendNewOrderConfirmation({
      orderId: orderNotification.orderId,
      userId: orderNotification.userId,
      userChatId: orderNotification.userChatId,
      status: orderNotification.status,
      totalPrice: orderNotification.totalPrice,
      itemCount: orderNotification.itemCount,
    });
    return {
      success,
      message: success
        ? 'Order confirmation sent successfully'
        : 'Failed to send order confirmation',
    };
  }
}
