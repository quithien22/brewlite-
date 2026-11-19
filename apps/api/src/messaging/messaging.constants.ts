/** Token để inject ClientProxy của RabbitMQ (null khi không cấu hình RABBITMQ_URL). */
export const RABBITMQ_CLIENT = 'RABBITMQ_CLIENT';

/** Queue dùng chung cho producer (EventPublisher) và consumer (OrderEventsController). */
export const ORDER_EVENTS_QUEUE = 'brewlite.order_events';

/**
 * Hai phía phải khai báo queue giống hệt nhau,
 * nếu lệch RabbitMQ sẽ báo PRECONDITION_FAILED.
 */
export const ORDER_EVENTS_QUEUE_OPTIONS = { durable: true };

/** Các sự kiện vòng đời của đơn hàng. */
export const ORDER_EVENTS = {
  CREATED: 'order.created',
  PAID: 'order.paid',
  CANCELLED: 'order.cancelled',
  REFUNDED: 'order.refunded',
} as const;

export type OrderEventName = (typeof ORDER_EVENTS)[keyof typeof ORDER_EVENTS];

export interface OrderEventPayload {
  orderId: number;
  userId: number;
  /** Tổng tiền của đơn (đồng) */
  total?: number;
  /** Với order.cancelled: USER (khách tự hủy) hoặc EXPIRED (quá hạn thanh toán) */
  reason?: 'USER' | 'EXPIRED';
  /** ISO 8601, do EventPublisher tự gắn */
  occurredAt?: string;
}
