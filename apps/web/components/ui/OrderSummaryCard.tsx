import { vnd } from "@/lib/format";

/** Khối "Tóm tắt đơn hàng" dùng chung cho giỏ hàng / thanh toán / chi tiết đơn. */
export default function OrderSummaryCard({
  itemCount,
  subtotal,
  couponCode,
  discount,
  pointsDiscount,
  total,
  children,
}: {
  itemCount: number;
  subtotal: number;
  couponCode?: string | null;
  discount: number;
  pointsDiscount: number;
  total: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <h2 className="mb-4 text-lg font-bold text-ink">Tóm tắt đơn hàng</h2>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between text-muted">
          <dt>Tạm tính · {itemCount} sản phẩm</dt>
          <dd className="text-ink">{vnd(subtotal)}</dd>
        </div>
        <div className="flex justify-between text-muted">
          <dt>Ưu đãi{couponCode ? ` ${couponCode}` : ""}</dt>
          <dd className="text-ink">{discount > 0 ? `−${vnd(discount)}` : "0đ"}</dd>
        </div>
        <div className="flex justify-between text-muted">
          <dt>Điểm thưởng sử dụng</dt>
          <dd className="text-ink">
            {pointsDiscount > 0 ? `−${vnd(pointsDiscount)}` : "0đ"}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
        <span className="font-bold text-ink">Tổng cộng</span>
        <span className="text-2xl font-bold text-brand">{vnd(total)}</span>
      </div>
      <p className="mt-3 text-xs text-muted">
        Đã bao gồm thuế. Nhận tại cửa hàng, không có phí giao hàng.
      </p>
      {children}
      <p className="mt-4 text-xs text-brand">
        Thanh toán an toàn · Không dùng tiền mặt
      </p>
    </div>
  );
}
