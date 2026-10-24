import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, JwtAuthGuard } from '../auth/auth.guards';
import type { AuthUser } from '../auth/jwt.strategy';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** POST /payments — bắt buộc header `Idempotency-Key` */
  @Post()
  pay(
    @CurrentUser() user: AuthUser,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() dto: CreatePaymentDto,
  ) {
    const key = idempotencyKey?.trim();
    if (!key || key.length < 8 || key.length > 100) {
      throw new BadRequestException(
        'Thiếu hoặc sai header Idempotency-Key (8–100 ký tự)',
      );
    }
    return this.payments.pay(user.id, key, dto);
  }
}
