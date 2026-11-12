import { ConflictException } from '@nestjs/common';
import type { OrderStatus } from '@prisma/client';

/**
 * Order State Machine (MVP, FR-25)
 *
 *  PENDING ──► PAID ──► REFUNDED       (khách hủy + hoàn tiền trong thời hạn cho phép)
 *     │
 *     ├──► PAYMENT_FAILED ──► PENDING (thử lại) / CANCELLED
 *     └──► CANCELLED
 *
 * MVP không có trạng thái pha chế (PREPARING / READY / COMPLETED).
 * CANCELLED và REFUNDED là trạng thái kết thúc.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
  PAID: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export const TERMINAL_STATUSES: readonly OrderStatus[] = ['CANCELLED', 'REFUNDED'];

/** Các trạng thái khách hủy trực tiếp được (chưa thanh toán, không cần hoàn tiền). */
export const CANCELLABLE_STATUSES: readonly OrderStatus[] = [
  'PENDING',
  'PAYMENT_FAILED',
];

/** Trạng thái được hủy kèm hoàn tiền (chỉ trong thời hạn REFUND_WINDOW_MINUTES). */
export const REFUNDABLE_STATUSES: readonly OrderStatus[] = ['PAID'];

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** Ném lỗi 409 nếu chuyển trạng thái không hợp lệ (AC-25.1). */
export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new ConflictException(
      `Không thể chuyển trạng thái đơn hàng từ ${from} sang ${to}`,
    );
  }
}
