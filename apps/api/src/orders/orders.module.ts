import { Module } from '@nestjs/common';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { OrderExpiryService } from './order-expiry.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PromotionsModule, LoyaltyModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderExpiryService],
  exports: [OrdersService],
})
export class OrdersModule {}
