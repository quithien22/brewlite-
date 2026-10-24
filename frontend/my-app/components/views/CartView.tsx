"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  btnOutline,
  btnPrimary,
  card,
  container,
  input,
} from "@/components/ui/classes";
import OrderSummaryCard from "@/components/ui/OrderSummaryCard";
import ProductImage from "@/components/ui/ProductImage";
import { EmptyState, Loading } from "@/components/ui/States";
import { api, ApiError } from "@/lib/api";
import { calcCartTotals } from "@/lib/cart-totals";
import { describeOptions, POINT_VALUE, vnd } from "@/lib/format";
import { useAuthStore } from "@/store/auth";
import { MAX_QTY, useCartStore } from "@/store/cart";

export default function CartView() {
  const hydrated = useCartStore((s) => s.hydrated);
  const lines = useCartStore((s) => s.lines);
  const note = useCartStore((s) => s.note);
  const coupon = useCartStore((s) => s.coupon);
  const pointsToUse = useCartStore((s) => s.pointsToUse);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const setNote = useCartStore((s) => s.setNote);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const setPointsToUse = useCartStore((s) => s.setPointsToUse);

  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const authHydrated = useAuthStore((s) => s.hydrated);

  const [code, setCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const totals = calcCartTotals(
    lines,
    coupon,
    pointsToUse,
    user?.loyaltyPoints ?? 0,
  );

  // Giỏ đổi thì kiểm tra lại mã giảm giá (đơn tối thiểu, số tiền giảm)
  useEffect(() => {
    if (!hydrated || !coupon || totals.subtotal <= 0) return;
    let off = false;
    api.promotions
      .validate(coupon.code, totals.subtotal)
      .then((r) => {
        if (off) return;
        if (r.valid) {
          if (r.discount !== coupon.discount) {
            setCoupon({
              code: r.code,
              title: r.title ?? coupon.title,
              discount: r.discount,
            });
          }
        } else {
          setCoupon(null);
          setCouponMsg({ ok: false, text: r.message });
        }
      })
      .catch(() => {});
    return () => {
      off = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, totals.subtotal, coupon?.code]);

  // Số điểm đang dùng không được vượt mức cho phép
  useEffect(() => {
    if (hydrated && authHydrated && pointsToUse !== totals.points) {
      setPointsToUse(totals.points);
    }
  }, [hydrated, authHydrated, pointsToUse, totals.points, setPointsToUse]);

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    const value = code.trim();
    if (!value) {
      setCouponMsg({ ok: false, text: "Vui lòng nhập mã giảm giá" });
      return;
    }
    setCouponBusy(true);
    setCouponMsg(null);
    try {
      const r = await api.promotions.validate(value, totals.subtotal);
      if (r.valid) {
        setCoupon({ code: r.code, title: r.title ?? r.code, discount: r.discount });
        setCode("");
      }
      setCouponMsg({ ok: r.valid, text: r.message });
    } catch (err) {
      setCouponMsg({
        ok: false,
        text: err instanceof ApiError ? err.message : "Không kiểm tra được mã",
      });
    } finally {
      setCouponBusy(false);
    }
  }

  if (!hydrated) return <Loading label="Đang tải giỏ hàng..." />;

  if (lines.length === 0) {
    return (
      <div className={`${container} py-10`}>
        <h1 className="mb-6 text-[32px] font-bold text-ink">Giỏ hàng</h1>
        <EmptyState
          title="Giỏ hàng đang trống"
          description="Chọn một ly yêu thích từ thực đơn, chúng mình sẽ giữ nó ở đây cho bạn."
          href="/menu"
          action="Xem thực đơn"
        />
      </div>
    );
  }

  const checkoutHref = token ? "/checkout" : "/login?next=/checkout";

  return (
    <div className={`${container} py-10`}>
      <div className="mb-6 flex items-end justify-between">
        <h1 className="text-[32px] font-bold text-ink">
          Giỏ hàng{" "}
          <span className="text-lg font-medium text-muted">
            ({totals.itemCount} sản phẩm)
          </span>
        </h1>
        <button
          onClick={() => {
            if (window.confirm("Xóa toàn bộ giỏ hàng?")) clear();
          }}
          className="text-sm font-semibold text-muted hover:text-danger"
        >
          Xóa giỏ hàng
        </button>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <ul className="flex flex-col gap-4">
            {lines.map((l) => (
              <li key={l.key} className={`${card} flex gap-4 p-4`}>
                <ProductImage
                  src={l.imageUrl}
                  alt={l.name}
                  className="h-24 w-24 shrink-0 rounded-xl"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-ink">{l.name}</h3>
                      <p className="text-xs text-muted">{describeOptions(l)}</p>
                      <p className="mt-1 text-sm text-muted">{vnd(l.unitPrice)} / ly</p>
                    </div>
                    <p className="font-bold text-brand">{vnd(l.unitPrice * l.qty)}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        aria-label="Giảm số lượng"
                        disabled={l.qty <= 1}
                        onClick={() => setQty(l.key, l.qty - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line font-bold text-ink hover:border-brand disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{l.qty}</span>
                      <button
                        aria-label="Tăng số lượng"
                        disabled={l.qty >= MAX_QTY}
                        onClick={() => setQty(l.key, l.qty + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line font-bold text-ink hover:border-brand disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => remove(l.key)}
                      className="text-sm font-semibold text-muted hover:text-danger"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Link href="/menu" className="text-sm font-bold text-brand hover:underline">
            + Thêm sản phẩm khác
          </Link>

          <div className={card}>
            <h2 className="mb-3 text-base font-bold text-ink">Mã giảm giá</h2>
            {coupon ? (
              <div className="flex items-center justify-between rounded-lg bg-[#E6F3EA] px-4 py-3 text-sm text-[#1E7A43]">
                <span>
                  <b>{coupon.code}</b> · {coupon.title} · −{vnd(totals.discount)}
                </span>
                <button
                  onClick={() => {
                    setCoupon(null);
                    setCouponMsg(null);
                  }}
                  className="font-bold hover:underline"
                >
                  Bỏ mã
                </button>
              </div>
            ) : (
              <form onSubmit={applyCoupon} className="flex gap-3">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã (ví dụ CHAO10)"
                  maxLength={30}
                  aria-label="Mã giảm giá"
                  className={input}
                />
                <button disabled={couponBusy} className={`${btnOutline} shrink-0`}>
                  {couponBusy ? "Đang kiểm tra..." : "Áp dụng"}
                </button>
              </form>
            )}
            {couponMsg && (
              <p
                role="status"
                className={`mt-2 text-sm ${couponMsg.ok ? "text-ok" : "text-danger"}`}
              >
                {couponMsg.text}
              </p>
            )}
            <Link
              href="/promotions"
              className="mt-3 inline-block text-xs font-bold text-brand hover:underline"
            >
              Xem các khuyến mãi đang có
            </Link>
          </div>

          <div className={card}>
            <h2 className="mb-1 text-base font-bold text-ink">Điểm thưởng</h2>
            {!token || !user ? (
              <p className="text-sm text-muted">
                <Link href="/login?next=/cart" className="font-bold text-brand hover:underline">
                  Đăng nhập
                </Link>{" "}
                để dùng điểm thưởng (1 điểm = {vnd(POINT_VALUE)}).
              </p>
            ) : user.loyaltyPoints <= 0 ? (
              <p className="text-sm text-muted">
                Bạn chưa có điểm. Mỗi 10.000đ trong đơn sẽ được cộng 1 điểm.
              </p>
            ) : (
              <>
                <p className="mb-3 text-sm text-muted">
                  Bạn có <b className="text-ink">{user.loyaltyPoints}</b> điểm · 1 điểm ={" "}
                  {vnd(POINT_VALUE)}
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={totals.maxPoints}
                    value={totals.points}
                    onChange={(e) =>
                      setPointsToUse(
                        Math.max(0, Math.min(totals.maxPoints, Number(e.target.value) || 0)),
                      )
                    }
                    aria-label="Số điểm muốn dùng"
                    className={`${input} max-w-[140px]`}
                  />
                  <button
                    type="button"
                    onClick={() => setPointsToUse(totals.maxPoints)}
                    className={btnOutline}
                  >
                    Dùng tối đa ({totals.maxPoints})
                  </button>
                  {totals.points > 0 && (
                    <button
                      type="button"
                      onClick={() => setPointsToUse(0)}
                      className="text-sm font-semibold text-muted hover:text-danger"
                    >
                      Bỏ
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className={card}>
            <label htmlFor="note" className="mb-3 block text-base font-bold text-ink">
              Ghi chú cho quầy
            </label>
            <textarea
              id="note"
              rows={2}
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: ít ngọt, cho mình thêm ống hút giấy"
              className={input}
            />
          </div>
        </div>

        <div className="lg:sticky lg:top-24">
          <OrderSummaryCard
            itemCount={totals.itemCount}
            subtotal={totals.subtotal}
            couponCode={coupon?.code}
            discount={totals.discount}
            pointsDiscount={totals.pointsDiscount}
            total={totals.total}
          >
            <Link href={checkoutHref} className={`${btnPrimary} mt-5 w-full py-4`}>
              Thanh toán · {vnd(totals.total)}
            </Link>
            {!token && (
              <p className="mt-2 text-center text-xs text-muted">
                Bạn sẽ được yêu cầu đăng nhập trước khi thanh toán.
              </p>
            )}
          </OrderSummaryCard>
        </div>
      </div>
    </div>
  );
}
