/** Quy tắc giá & tùy chọn dùng chung cho toàn bộ backend (nguồn sự thật duy nhất). */

export const SIZES = [
  { code: 'S', label: 'Cỡ S', extra: 0 },
  { code: 'M', label: 'Cỡ M', extra: 6000 },
  { code: 'L', label: 'Cỡ L', extra: 12000 },
] as const;

export type SizeCode = (typeof SIZES)[number]['code'];
export const SIZE_CODES: SizeCode[] = SIZES.map((s) => s.code);

export const SUGAR_LEVELS = ['0%', '30%', '50%', '70%', '100%'];
export const ICE_LEVELS = ['Không đá', 'Ít đá', 'Đá bình thường'];
export const DEFAULT_SUGAR = '100%';
export const DEFAULT_ICE = 'Đá bình thường';

/** 1 điểm thưởng quy đổi được bao nhiêu VND khi thanh toán. */
export const POINT_VALUE = 500;
/** Cứ mỗi 10.000đ trong tổng đơn (sau giảm giá) được cộng 1 điểm. */
export const EARN_UNIT = 10000;

export function sizeExtra(code: SizeCode): number {
  return SIZES.find((s) => s.code === code)?.extra ?? 0;
}

export function calcUnitPrice(
  basePrice: number,
  size: SizeCode,
  toppingPrices: number[],
): number {
  return (
    basePrice + sizeExtra(size) + toppingPrices.reduce((sum, p) => sum + p, 0)
  );
}

export function earnedPoints(total: number): number {
  return Math.max(0, Math.floor(total / EARN_UNIT));
}
