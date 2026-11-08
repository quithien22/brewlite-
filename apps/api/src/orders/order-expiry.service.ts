import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ORDER_EXPIRE_MINUTES_DEFAULT } from '../common/constants';
import { OrdersService } from './orders.service';

/**
 * FR-27: tự hủy đơn PENDING / PAYMENT_FAILED quá hạn để trả lại tồn kho, lượt mã, điểm.
 * Chạy mỗi phút; không dùng thêm thư viện lập lịch. Đặt ORDER_EXPIRY_DISABLED=true để tắt.
 */
@Injectable()
export class OrderExpiryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderExpiryService.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly orders: OrdersService) {}

  onModuleInit() {
    if (process.env.ORDER_EXPIRY_DISABLED === 'true') return;
    const minutes =
      Number(process.env.ORDER_EXPIRE_MINUTES) || ORDER_EXPIRE_MINUTES_DEFAULT;

    this.timer = setInterval(() => {
      this.orders
        .expireStale(minutes)
        .then((n) => {
          if (n > 0) this.logger.log(`Đã tự hủy ${n} đơn chưa thanh toán quá ${minutes} phút`);
        })
        .catch((e) =>
          this.logger.error(
            `Tự hủy đơn quá hạn thất bại: ${e instanceof Error ? e.message : String(e)}`,
          ),
        );
    }, 60_000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
