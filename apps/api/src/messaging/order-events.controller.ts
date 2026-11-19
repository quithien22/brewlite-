import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ORDER_EVENTS, OrderEventPayload } from './messaging.constants';

/**
 * Consumer: nhận sự kiện đơn hàng từ RabbitMQ.
 * Hiện chỉ ghi log; đây là chỗ để gắn thêm xử lý bất đồng bộ
 * (gửi email / thông báo cho khách, báo cho quầy pha chế, thống kê...).
 *
 * Chỉ nhận message khi main.ts đã connectMicroservice (có RABBITMQ_URL).
 */
@Controller()
export class OrderEventsController {
  private readonly logger = new Logger('OrderEvents');

  @EventPattern(ORDER_EVENTS.CREATED)
  onCreated(@Payload() data: OrderEventPayload, @Ctx() ctx: RmqContext) {
    return this.handle(ctx, () =>
      this.logger.log(
        `Đơn #${data.orderId} vừa được tạo (khách ${data.userId}, tổng ${data.total ?? '?'}đ)`,
      ),
    );
  }

  @EventPattern(ORDER_EVENTS.PAID)
  onPaid(@Payload() data: OrderEventPayload, @Ctx() ctx: RmqContext) {
    return this.handle(ctx, () =>
      this.logger.log(
        `Đơn #${data.orderId} đã thanh toán ${data.total ?? '?'}đ, chuyển cho quầy pha chế`,
      ),
    );
  }

  @EventPattern(ORDER_EVENTS.CANCELLED)
  onCancelled(@Payload() data: OrderEventPayload, @Ctx() ctx: RmqContext) {
    return this.handle(ctx, () =>
      this.logger.log(
        `Đơn #${data.orderId} đã hủy (${data.reason === 'EXPIRED' ? 'quá hạn thanh toán' : 'khách hủy'})`,
      ),
    );
  }

  @EventPattern(ORDER_EVENTS.REFUNDED)
  onRefunded(@Payload() data: OrderEventPayload, @Ctx() ctx: RmqContext) {
    return this.handle(ctx, () =>
      this.logger.log(`Đơn #${data.orderId} đã hoàn tiền ${data.total ?? '?'}đ`),
    );
  }

  /**
   * Xử lý xong thì ack. Lỗi thì nack KHÔNG đưa lại vào hàng đợi
   * để một message hỏng không bị giao lại vô hạn.
   */
  private async handle(ctx: RmqContext, work: () => void | Promise<void>) {
    const channel = ctx.getChannelRef();
    const message = ctx.getMessage();
    try {
      await work();
      channel.ack(message);
    } catch (e) {
      this.logger.error(
        `Xử lý sự kiện thất bại: ${e instanceof Error ? e.message : String(e)}`,
      );
      channel.nack(message, false, false);
    }
  }
}
