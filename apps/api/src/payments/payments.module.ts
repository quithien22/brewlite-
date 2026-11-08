import { Module } from '@nestjs/common';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { OrdersModule } from '../orders/orders.module';
import { MockPaymentGateway } from './mock-payment.gateway';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [OrdersModule, LoyaltyModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MockPaymentGateway],
})
export class PaymentsModule {}
