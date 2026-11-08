import { ConflictException } from '@nestjs/common';
import type { OrderStatus } from '@prisma/client';
import {
  CANCELLABLE_STATUSES,
  ORDER_TRANSITIONS,
  TERMINAL_STATUSES,
  assertTransition,
  canTransition,
} from './order-state-machine';

const ALL: OrderStatus[] = ['PENDING', 'PAID', 'PAYMENT_FAILED', 'CANCELLED'];

/** Các cạnh hợp lệ theo FR-25. */
const VALID: [OrderStatus, OrderStatus][] = [
  ['PENDING', 'PAID'],
  ['PENDING', 'PAYMENT_FAILED'],
  ['PAYMENT_FAILED', 'PENDING'], // thử thanh toán lại
  ['PENDING', 'CANCELLED'],
  ['PAYMENT_FAILED', 'CANCELLED'],
];

describe('Order State Machine (MVP)', () => {
  it.each(VALID)('cho phép %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
    expect(() => assertTransition(from, to)).not.toThrow();
  });

  it('chặn MỌI chuyển trạng thái không nằm trong sơ đồ bằng HTTP 409', () => {
    const allowed = new Set(VALID.map(([f, t]) => `${f}>${t}`));
    for (const from of ALL) {
      for (const to of ALL) {
        if (allowed.has(`${from}>${to}`)) continue;
        expect(canTransition(from, to)).toBe(false);
        expect(() => assertTransition(from, to)).toThrow(ConflictException);
      }
    }
  });

  it('PAID là trạng thái cuối: không hủy, không đi tiếp', () => {
    expect(ORDER_TRANSITIONS.PAID).toHaveLength(0);
    expect(canTransition('PAID', 'CANCELLED')).toBe(false);
    expect(canTransition('PAID', 'PENDING')).toBe(false);
  });

  it('PAID và CANCELLED là trạng thái kết thúc', () => {
    for (const status of TERMINAL_STATUSES) {
      expect(ORDER_TRANSITIONS[status]).toHaveLength(0);
    }
  });

  it('khách chỉ hủy được đơn PENDING hoặc PAYMENT_FAILED', () => {
    expect([...CANCELLABLE_STATUSES].sort()).toEqual(['PAYMENT_FAILED', 'PENDING']);
  });

  it('thông báo lỗi nêu rõ trạng thái nguồn và đích', () => {
    expect(() => assertTransition('PAID', 'PENDING')).toThrow(
      'Không thể chuyển trạng thái đơn hàng từ PAID sang PENDING',
    );
  });
});
