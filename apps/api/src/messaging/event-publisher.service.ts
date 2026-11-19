import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  OrderEventName,
  OrderEventPayload,
  RABBITMQ_CLIENT,
} from './messaging.constants';

/**
 * Gửi sự kiện sang RabbitMQ (fire-and-forget).
 *
 * - Không có RABBITMQ_URL → không làm gì (chạy local / chạy test không cần RabbitMQ).
 * - Lỗi gửi chỉ ghi log, KHÔNG làm hỏng nghiệp vụ đặt hàng / thanh toán.
 * - Luôn gọi SAU KHI transaction đã commit để consumer không thấy dữ liệu chưa tồn tại.
 */
@Injectable()
export class EventPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(EventPublisher.name);

  constructor(
    @Inject(RABBITMQ_CLIENT) private readonly client: ClientProxy | null,
  ) {}

  publish(event: OrderEventName, payload: OrderEventPayload): void {
    if (!this.client) return;
    try {
      this.client
        .emit(event, { ...payload, occurredAt: new Date().toISOString() })
        .subscribe({
          error: (err) =>
            this.logger.warn(
              `Không gửi được sự kiện ${event}: ${err instanceof Error ? err.message : String(err)}`,
            ),
        });
    } catch (err) {
      this.logger.warn(
        `Không gửi được sự kiện ${event}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.client?.close();
  }
}
