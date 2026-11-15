"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { useApi } from "@/lib/hooks";
import type { Promotion } from "@/lib/types";
import { useAuthStore } from "@/store/auth";
import { MAX_QTY, useCartStore } from "@/store/cart";

const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    code: "CHAO10",
    title: "Ly đầu tiên giảm 10%",
    description: "Dành cho khách hàng mới. Đơn từ 50.000đ.",
    type: "PERCENT",
    value: 10,
    minOrder: 50000,
    maxDiscount: 20000,
    endsAt: "",
  },
  {
    code: "GIAM15K",
    title: "Giảm 15.000đ cho đơn từ 100.000đ",
    description: "Uống cùng bạn bè, tiết kiệm nhiều hơn.",
    type: "FIXED",
    value: 15000,
    minOrder: 100000,
    maxDiscount: null,
    endsAt: "",
  },
  {
    code: "COMBO20",
    title: "Giảm 20% cho đơn từ 150.000đ",
    description: "Tối đa 40.000đ. Số lượng có hạn.",
    type: "PERCENT",
    value: 20,
    minOrder: 150000,
    maxDiscount: 40000,
    endsAt: "",
  },
];

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
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  const { data: activePromos } = useApi(
    () => api.promotions.list().catch(() => []),
    [],
  );

  const availablePromos = useMemo(() => {
    if (activePromos && activePromos.length > 0) return activePromos;
    return DEFAULT_PROMOTIONS;
  }, [activePromos]);

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

  async function handleApplyCode(rawCode: string) {
    const value = rawCode.trim().toUpperCase();
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

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    await handleApplyCode(code);
  }

  function handleChipClick(promo: Promotion) {
    // Nếu đang dùng mã này -> bấm lần nữa để hủy mã
    if (coupon?.code === promo.code) {
      setCoupon(null);
      setCouponMsg({ ok: true, text: `Đã bỏ áp dụng mã ${promo.code}` });
      return;
    }
    // Nếu đơn chưa đủ điều kiện tối thiểu
    if (totals.subtotal < promo.minOrder) {
      setCode(promo.code);
      setCouponMsg({
        ok: false,
        text: `Mã ${promo.code} áp dụng cho đơn từ ${vnd(promo.minOrder)}. Bạn cần mua thêm ${vnd(promo.minOrder - totals.subtotal)} để dùng mã này.`,
      });
      return;
    }
    // Áp dụng ngay
    handleApplyCode(promo.code);
  }

  if (!hydrated) return <Loading label="Đang tải giỏ hàng..." />;

  if (lines.length === 0) {
    return (
      <div className={`${container} py-6 sm:py-10`}>
        <h1 className="mb-6 text-2xl font-bold text-ink sm:text-[32px]">Giỏ hàng</h1>
        {coupon && (
          <div className="mb-6 flex flex-col gap-2 rounded-xl bg-[#E6F3EA] p-4 text-sm text-[#1E7A43] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold">✓ Đang chọn sẵn mã ưu đãi: {coupon.code}</p>
              <p className="text-xs text-[#1E7A43]/80">
                {coupon.title} · Hãy thêm món vào giỏ để tự động áp dụng ưu đãi!
              </p>
            </div>
            <Link
              href="/menu"
              className="inline-flex w-max rounded-lg bg-[#1E7A43] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#1E7A43]/90"
            >
              Chọn đồ uống ngay →
            </Link>
          </div>
        )}
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
    <div className={`${container} py-6 sm:py-10`}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 sm:mb-6">
        <h1 className="text-2xl font-bold text-ink sm:text-[32px]">
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

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
        <div className="flex flex-col gap-4 sm:gap-6">
          <ul className="flex flex-col gap-3 sm:gap-4">
            {lines.map((l) => (
              <li key={l.key} className={`${card} flex gap-3 p-3 sm:gap-4 sm:p-4`}>
                <ProductImage
                  src={l.imageUrl}
                  alt={l.name}
                  className="h-20 w-20 shrink-0 rounded-xl sm:h-24 sm:w-24"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
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
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-line font-bold text-ink hover:border-brand disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{l.qty}</span>
                      <button
                        aria-label="Tăng số lượng"
                        disabled={l.qty >= MAX_QTY}
                        onClick={() => setQty(l.key, l.qty + 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-line font-bold text-ink hover:border-brand disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => remove(l.key)}
                      className="flex min-h-[40px] items-center px-2 text-sm font-semibold text-muted hover:text-danger"
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
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-ink">Mã giảm giá</h2>
              <button
                type="button"
                onClick={() => setShowVoucherModal(true)}
                className="text-xs font-bold text-brand hover:underline cursor-pointer"
              >
                Xem tất cả ưu đãi ({availablePromos.length}) →
              </button>
            </div>

            {coupon ? (
              <div className="flex flex-col gap-2 rounded-lg bg-[#E6F3EA] px-4 py-3 text-sm text-[#1E7A43] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="font-bold">{coupon.code}</span>
                  <span className="mx-1.5">·</span>
                  <span>{coupon.title}</span>
                  <span className="mx-1.5">·</span>
                  <span className="font-semibold text-brand">−{vnd(totals.discount)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCoupon(null);
                    setCouponMsg(null);
                  }}
                  className="font-bold text-[#1E7A43] hover:underline"
                >
                  Bỏ mã
                </button>
              </div>
            ) : (
              <form onSubmit={applyCoupon} className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã (ví dụ CHAO10)"
                  maxLength={30}
                  aria-label="Mã giảm giá"
                  className={input}
                />
                <button
                  type="submit"
                  disabled={couponBusy || !code.trim()}
                  className={`${btnOutline} shrink-0 disabled:opacity-50`}
                >
                  {couponBusy ? "Đang kiểm tra..." : "Áp dụng"}
                </button>
              </form>
            )}

            {couponMsg && (
              <p
                role="status"
                className={`mt-2.5 text-sm font-medium ${
                  couponMsg.ok ? "text-ok" : "text-danger"
                }`}
              >
                {couponMsg.text}
              </p>
            )}

            {/* Bộ chip chọn nhanh voucher 1 chạm */}
            <div className="mt-4 border-t border-line/60 pt-3">
              <p className="mb-2.5 text-xs font-semibold text-muted">
                Gợi ý mã ưu đãi 1 chạm:
              </p>
              <div className="flex flex-wrap gap-2">
                {availablePromos.map((p) => {
                  const isApplied = coupon?.code === p.code;
                  const isEligible = totals.subtotal >= p.minOrder;
                  const discountLabel =
                    p.type === "PERCENT"
                      ? `Giảm ${p.value}%`
                      : `Giảm ${vnd(p.value)}`;

                  return (
                    <button
                      key={p.code}
                      type="button"
                      disabled={couponBusy}
                      onClick={() => handleChipClick(p)}
                      title={p.description || p.title}
                      className={`group inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition cursor-pointer disabled:cursor-not-allowed ${
                        isApplied
                          ? "border-[#1E7A43] bg-[#E6F3EA] text-[#1E7A43] ring-1 ring-[#1E7A43]"
                          : isEligible
                            ? "border-brand/40 bg-brand/5 text-ink hover:border-brand hover:bg-brand/10 hover:shadow-xs"
                            : "border-line bg-gray-50 text-muted opacity-80 hover:bg-gray-100"
                      }`}
                    >
                      <span
                        className={`font-mono font-bold tracking-wide ${
                          isApplied
                            ? "text-[#1E7A43]"
                            : isEligible
                              ? "text-brand"
                              : "text-muted"
                        }`}
                      >
                        {p.code}
                      </span>
                      <span className="text-[10px] text-muted">·</span>
                      <span className="font-semibold">{discountLabel}</span>
                      {isApplied ? (
                        <span className="ml-1 rounded-full bg-[#1E7A43] px-1.5 py-0.5 text-[9px] font-bold text-white">
                          ✓ Đang dùng
                        </span>
                      ) : !isEligible ? (
                        <span className="text-[10px] text-muted">
                          (từ {vnd(p.minOrder)})
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-brand group-hover:underline">
                          Áp dụng →
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
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
                <div className="flex flex-wrap items-center gap-3">
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
                    className={`${input} max-w-[120px] sm:max-w-[140px]`}
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
                      className="flex min-h-[44px] items-center px-2 text-sm font-semibold text-muted hover:text-danger"
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

      {/* Modal Bottom Sheet xem & chọn voucher trực tiếp trên mobile/desktop không rời giỏ */}
      {showVoucherModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Danh sách mã giảm giá"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:items-center sm:p-4 animate-fadeIn"
          onClick={() => setShowVoucherModal(false)}
        >
          <div
            className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-ink">Ưu đãi & Khuyến mãi</h3>
                <p className="text-xs text-muted">
                  Bấm để áp dụng trực tiếp vào đơn hàng hiện tại
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowVoucherModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-ink hover:bg-line text-sm font-bold cursor-pointer"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Danh sách voucher */}
            <div className="overflow-y-auto p-4 space-y-3">
              {availablePromos.map((p) => {
                const isApplied = coupon?.code === p.code;
                const isEligible = totals.subtotal >= p.minOrder;
                const discountText =
                  p.type === "PERCENT"
                    ? `Giảm ${p.value}%${p.maxDiscount ? ` (tối đa ${vnd(p.maxDiscount)})` : ""}`
                    : `Giảm ${vnd(p.value)}`;

                return (
                  <div
                    key={p.code}
                    className={`rounded-2xl border p-4 transition ${
                      isApplied
                        ? "border-[#1E7A43] bg-[#E6F3EA]/70 ring-1 ring-[#1E7A43]"
                        : isEligible
                          ? "border-line bg-white hover:border-brand/60 hover:shadow-xs"
                          : "border-line bg-gray-50/80 opacity-80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold tracking-wide text-brand">
                            {p.code}
                          </span>
                          <span className="rounded-full bg-cream px-2 py-0.5 text-[11px] font-bold text-brand">
                            {discountText}
                          </span>
                        </div>
                        <h4 className="mt-1 text-sm font-bold text-ink">{p.title}</h4>
                        <p className="mt-0.5 text-xs text-muted">{p.description}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2.5 text-xs text-muted">
                      <span>
                        Đơn tối thiểu:{" "}
                        <strong className="text-ink">
                          {p.minOrder > 0 ? vnd(p.minOrder) : "0đ"}
                        </strong>
                      </span>
                      <button
                        type="button"
                        disabled={couponBusy}
                        onClick={() => {
                          handleChipClick(p);
                          if (!isApplied && isEligible) {
                            setShowVoucherModal(false);
                          }
                        }}
                        className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                          isApplied
                            ? "border border-[#1E7A43] bg-white text-[#1E7A43] hover:bg-red-50 hover:text-danger hover:border-danger"
                            : isEligible
                              ? "bg-brand text-white hover:bg-brand/90 shadow-xs"
                              : "bg-gray-200 text-muted cursor-not-allowed"
                        }`}
                      >
                        {isApplied
                          ? "Bỏ mã"
                          : isEligible
                            ? "Áp dụng ngay"
                            : `Thiếu ${vnd(p.minOrder - totals.subtotal)}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-line p-3">
              <button
                type="button"
                onClick={() => setShowVoucherModal(false)}
                className={`${btnOutline} w-full py-2.5 text-sm font-bold cursor-pointer`}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
