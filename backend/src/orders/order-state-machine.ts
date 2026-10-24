import { BadRequestException } from '@nestjs/common';
import type { OrderStatus } from '@prisma/client';

/**
 * Order State Machine (Task 10 – yêu cầu 1)
 *
 *  PENDING ──► PAID ──► PREPARING ──► READY ──► COMPLETED
 *     │          │
 *     │          └──► CANCELLED
 *     ├──► PAYMENT_FAILED ──► PENDING (thử lại) / CANCELLED
 *     └──► CANCELLED
 *
 * COMPLETED và CANCELLED là trạng thái kết thúc.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const TERMINAL_STATUSES: readonly OrderStatus[] = [
  'COMPLETED',
  'CANCELLED',
];

/** Các trạng thái khách còn được phép hủy đơn. */
export const CANCELLABLE_STATUSES: readonly OrderStatus[] = [
  'PENDING',
  'PAYMENT_FAILED',
  'PAID',
];

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** Ném lỗi 400 nếu chuyển trạng thái không hợp lệ. */
export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new BadRequestException(
      `Không thể chuyển trạng thái đơn hàng từ ${from} sang ${to}`,
    );
  }
}
