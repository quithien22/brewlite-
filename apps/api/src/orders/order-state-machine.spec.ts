import { BadRequestException } from '@nestjs/common';
import type { OrderStatus } from '@prisma/client';
import {
  ORDER_TRANSITIONS,
  TERMINAL_STATUSES,
  assertTransition,
  canTransition,
} from './order-state-machine';

const ALL: OrderStatus[] = [
  'PENDING',
  'PAID',
  'PREPARING',
  'READY',
  'COMPLETED',
  'PAYMENT_FAILED',
  'CANCELLED',
];

/** Các cạnh hợp lệ theo sơ đồ ở Mục 9.1 của đề bài. */
const VALID: [OrderStatus, OrderStatus][] = [
  ['PENDING', 'PAID'],
  ['PAID', 'PREPARING'],
  ['PREPARING', 'READY'],
  ['READY', 'COMPLETED'],
  ['PENDING', 'PAYMENT_FAILED'],
  ['PAYMENT_FAILED', 'PENDING'], // thử thanh toán lại
  ['PENDING', 'CANCELLED'],
  ['PAYMENT_FAILED', 'CANCELLED'],
  ['PAID', 'CANCELLED'],
];

describe('Order State Machine', () => {
  it('cho phép đi hết luồng thành công PENDING → PAID → PREPARING → READY → COMPLETED', () => {
    const path: OrderStatus[] = [
      'PENDING',
      'PAID',
      'PREPARING',
      'READY',
      'COMPLETED',
    ];
    for (let i = 0; i < path.length - 1; i++) {
      expect(() => assertTransition(path[i], path[i + 1])).not.toThrow();
    }
  });

  it.each(VALID)('cho phép %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
    expect(() => assertTransition(from, to)).not.toThrow();
  });

  it('chặn MỌI chuyển trạng thái không nằm trong sơ đồ', () => {
    const allowed = new Set(VALID.map(([f, t]) => `${f}>${t}`));
    for (const from of ALL) {
      for (const to of ALL) {
        if (allowed.has(`${from}>${to}`)) continue;
        expect(canTransition(from, to)).toBe(false);
        expect(() => assertTransition(from, to)).toThrow(BadRequestException);
      }
    }
  });

  it('chặn nhảy cóc trạng thái (PENDING → READY, PAID → COMPLETED)', () => {
    expect(() => assertTransition('PENDING', 'READY')).toThrow(
      BadRequestException,
    );
    expect(() => assertTransition('PAID', 'COMPLETED')).toThrow(
      BadRequestException,
    );
  });

  it('chặn đi lùi (READY → PREPARING, COMPLETED → PAID)', () => {
    expect(() => assertTransition('READY', 'PREPARING')).toThrow(
      BadRequestException,
    );
    expect(() => assertTransition('COMPLETED', 'PAID')).toThrow(
      BadRequestException,
    );
  });

  it('COMPLETED và CANCELLED là trạng thái kết thúc (không đi tiếp được)', () => {
    for (const status of TERMINAL_STATUSES) {
      expect(ORDER_TRANSITIONS[status]).toHaveLength(0);
      for (const to of ALL) {
        expect(canTransition(status, to)).toBe(false);
      }
    }
  });

  it('không cho hủy đơn khi đang pha chế hoặc đã sẵn sàng', () => {
    expect(canTransition('PREPARING', 'CANCELLED')).toBe(false);
    expect(canTransition('READY', 'CANCELLED')).toBe(false);
  });

  it('thông báo lỗi nêu rõ trạng thái nguồn và đích', () => {
    expect(() => assertTransition('PENDING', 'COMPLETED')).toThrow(
      'Không thể chuyển trạng thái đơn hàng từ PENDING sang COMPLETED',
    );
  });
});
