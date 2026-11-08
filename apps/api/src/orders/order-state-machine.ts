import { ConflictException } from '@nestjs/common';
import type { OrderStatus } from '@prisma/client';

/**
 * Order State Machine (MVP, FR-25)
 *
 *  PENDING ──► PAID                    (PAID là trạng thái cuối)
 *     │
 *     ├──► PAYMENT_FAILED ──► PENDING (thử lại) / CANCELLED
 *     └──► CANCELLED
 *
 * MVP không có trạng thái pha chế (PREPARING / READY / COMPLETED).
 * PAID và CANCELLED là trạng thái kết thúc.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
  PAID: [],
  CANCELLED: [],
};

export const TERMINAL_STATUSES: readonly OrderStatus[] = ['PAID', 'CANCELLED'];

/** Các trạng thái khách còn được phép hủy đơn (đơn PAID không hủy được). */
export const CANCELLABLE_STATUSES: readonly OrderStatus[] = [
  'PENDING',
  'PAYMENT_FAILED',
];

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
