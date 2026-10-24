import type { Promotion } from '@prisma/client';
import { calcDiscount } from './promotions.service';

const base: Promotion = {
  id: 1,
  code: 'TEST',
  title: 'Test',
  description: '',
  type: 'PERCENT',
  value: 10,
  minOrder: 0,
  maxDiscount: null,
  startsAt: new Date(0),
  endsAt: new Date(),
  usageLimit: null,
  usedCount: 0,
  isActive: true,
};

describe('Tính giảm giá khuyến mãi', () => {
  it('giảm theo %: 10% của 85.000đ = 8.500đ', () => {
    expect(calcDiscount(base, 85000)).toBe(8500);
  });

  it('giảm theo % bị chặn bởi trần maxDiscount', () => {
    expect(calcDiscount({ ...base, value: 20, maxDiscount: 40000 }, 400000)).toBe(
      40000,
    );
  });

  it('giảm số tiền cố định', () => {
    expect(calcDiscount({ ...base, type: 'FIXED', value: 15000 }, 120000)).toBe(
      15000,
    );
  });

  it('không bao giờ giảm quá tổng tiền hàng', () => {
    expect(calcDiscount({ ...base, type: 'FIXED', value: 50000 }, 30000)).toBe(
      30000,
    );
  });
});
