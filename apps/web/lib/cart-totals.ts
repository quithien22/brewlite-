import type { AppliedCoupon } from "@/store/cart";
import { POINT_VALUE } from "./format";
import type { CartLine } from "./types";

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  discount: number;
  /** Số điểm tối đa được dùng cho giỏ hiện tại */
  maxPoints: number;
  /** Số điểm thực sự áp dụng (đã chặn theo maxPoints) */
  points: number;
  pointsDiscount: number;
  total: number;
}

/**
 * Tính tổng tiền hiển thị ở giỏ hàng / thanh toán.
 * Chỉ để hiển thị — backend luôn tính lại giá khi tạo đơn.
 */
export function calcCartTotals(
  lines: CartLine[],
  coupon: AppliedCoupon | null,
  pointsToUse: number,
  userPoints: number,
): CartTotals {
  const itemCount = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const maxPoints = Math.max(
    0,
    Math.min(userPoints, Math.floor((subtotal - discount) / POINT_VALUE)),
  );
  const points = Math.max(0, Math.min(pointsToUse, maxPoints));
  const pointsDiscount = points * POINT_VALUE;
  return {
    itemCount,
    subtotal,
    discount,
    maxPoints,
    points,
    pointsDiscount,
    total: subtotal - discount - pointsDiscount,
  };
}
