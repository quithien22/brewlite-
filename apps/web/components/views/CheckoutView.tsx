"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { btnOutline, btnPrimary, card, container, input } from "@/components/ui/classes";
import OrderSummaryCard from "@/components/ui/OrderSummaryCard";
import ProductImage from "@/components/ui/ProductImage";
import { EmptyState, Loading } from "@/components/ui/States";
import { api, ApiError } from "@/lib/api";
import { calcCartTotals } from "@/lib/cart-totals";
import { describeOptions, vnd } from "@/lib/format";
import { useApi, useRequireAuth } from "@/lib/hooks";
import { newIdempotencyKey } from "@/lib/idempotency";
import type { CartLine, Order, PaymentMethod } from "@/lib/types";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";

const METHODS: { value: PaymentMethod; title: string; hint: string }[] = [
  { value: "WALLET", title: "Ví điện tử", hint: "Thanh toán qua MoMo (mô phỏng)" },
  { value: "CARD", title: "Thẻ ngân hàng", hint: "Thanh toán qua VNPay (mô phỏng)" },
];

// So sánh đơn PENDING với giỏ hàng hiện tại để không trả tiền nhầm đơn cũ.
function lineSignature(item: {
  productId: number;
  size: string;
  sugar: string;
  ice: string;
  toppings: { id: number }[];
  qty: number;
}) {
  const toppingIds = item.toppings.map((t) => t.id).sort((a, b) => a - b);
  return JSON.stringify([
    item.productId, item.size, item.sugar, item.ice, toppingIds, item.qty,
  ]);
}

function matchesCart(
  order: Order,
  lines: CartLine[],
  couponCode: string | undefined,
  pointsUsed: number,
  note: string,
): boolean {
  const cartItems = lines.map(lineSignature).sort();
  const orderItems = order.items.map(lineSignature).sort();
  return (
    JSON.stringify(cartItems) === JSON.stringify(orderItems) &&
    (order.couponCode ?? "").toUpperCase() === (couponCode ?? "").toUpperCase() &&
    order.pointsUsed === pointsUsed &&
    (order.note ?? "").trim() === note.trim()
  );
}

// Dùng lại key khi request trả lỗi mạng: tránh gọi cổng thanh toán hai lần.
const IDEMPOTENCY_PREFIX = "brewlite-mock-payment:";
const ALLOW_DEMO_FAILURE =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_ALLOW_MOCK_FAILURE === "true";

function errorText(err: unknown, networkHint: string): string {
  if (err instanceof ApiError) return err.isNetwork ? networkHint : err.message;
  return err instanceof Error ? err.message : "Đã xảy ra lỗi";
}

/**
 * Thanh toán theo UC-01, gồm hai bước:
 *  1. Xem lại giỏ hàng và "Xác nhận đặt hàng" → POST /orders tạo đơn PENDING (giữ tồn kho).
 *  2. Chọn Ví / Thẻ và "Thanh toán" → POST /payments (Idempotency-Key) → thành công thì đơn PAID.
 */
export default function CheckoutView() {
  const router = useRouter();
  const ready = useRequireAuth();

  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const cartHydrated = useCartStore((s) => s.hydrated);
  const lines = useCartStore((s) => s.lines);
  const note = useCartStore((s) => s.note);
  const setNote = useCartStore((s) => s.setNote);
  const coupon = useCartStore((s) => s.coupon);
  const pointsToUse = useCartStore((s) => s.pointsToUse);
  const pendingOrderId = useCartStore((s) => s.pendingOrderId);
  const setPendingOrderId = useCartStore((s) => s.setPendingOrderId);
  const clear = useCartStore((s) => s.clear);

  const [method, setMethod] = useState<PaymentMethod>("WALLET");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [created, setCreated] = useState<Order | null>(null); // đơn vừa tạo ở bước 1
  const [dismissed, setDismissed] = useState(false); // khách đã hủy đơn chờ thanh toán
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const memoryKeys = useRef(new Map<string, string>());

  // Đơn chờ thanh toán còn lại từ lần trước (tải trang lại, quay lại từ giỏ hàng...)
  const { data: pending, loading: pendingLoading } = useApi<Order | null>(
    () =>
      ready && cartHydrated && pendingOrderId !== null
        ? api.orders.get(pendingOrderId).catch(() => null)
        : Promise.resolve(null),
    [ready, cartHydrated],
  );

  // Đơn trước đó đã có kết quả thì đưa khách tới đúng màn hình, không tạo đơn mới đè lên.
  useEffect(() => {
    if (!pending) return;
    if (pending.status === "PAID") {
      clear();
      router.replace(`/orders/success?id=${pending.id}`);
    } else if (pending.status === "PAYMENT_FAILED") {
      router.replace(`/orders/failed?id=${pending.id}`);
    } else if (pending.status === "CANCELLED") {
      setPendingOrderId(null);
    }
  }, [pending, router, clear, setPendingOrderId]);

  const totals = calcCartTotals(lines, coupon, pointsToUse, user?.loyaltyPoints ?? 0);

  const resumable = pending && pending.status === "PENDING" && !dismissed ? pending : null;
  const resumableMatches =
    resumable !== null &&
    matchesCart(resumable, lines, coupon?.code, totals.points, note);
  const activeOrder: Order | null = created ?? (resumableMatches ? resumable : null);
  // Có đơn PENDING cũ nhưng giỏ hàng đã khác: không cho đặt đơn mới đè lên.
  const blockedBy = !created && resumable && !resumableMatches ? resumable : null;

  function getPaymentKey(orderId: number, paymentMethod: PaymentMethod): string {
    const storageKey = `${IDEMPOTENCY_PREFIX}${orderId}:${paymentMethod}`;
    const cached = memoryKeys.current.get(storageKey);
    if (cached) return cached;
    let key: string | null = null;
    try {
      key = window.localStorage.getItem(storageKey);
    } catch { /* Private browsing / blocked storage */ }
    key ??= newIdempotencyKey();
    memoryKeys.current.set(storageKey, key);
    try {
      window.localStorage.setItem(storageKey, key);
    } catch { /* Still reuse the in-memory key */ }
    return key;
  }

  function clearPaymentKey(orderId: number, paymentMethod: PaymentMethod) {
    const storageKey = `${IDEMPOTENCY_PREFIX}${orderId}:${paymentMethod}`;
    memoryKeys.current.delete(storageKey);
    try { window.localStorage.removeItem(storageKey); } catch { /* ignored */ }
  }

  if (!ready || !cartHydrated || (pendingLoading && !created)) return <Loading />;

  if (lines.length === 0 && !activeOrder) {
    return (
      <div className={`${container} py-6 sm:py-10`}>
        <EmptyState
          title="Chưa có gì để thanh toán"
          description="Giỏ hàng của bạn đang trống. Chọn đồ uống trước nhé."
          href="/menu"
          action="Xem thực đơn"
        />
      </div>
    );
  }

  /** Bước 1: tạo đơn PENDING. Giá và tồn kho do máy chủ tính / giữ. */
  async function placeOrder() {
    if (submitting.current || busy || blockedBy) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const order = await api.orders.create({
        items: lines.map((l) => ({
          productId: l.productId,
          size: l.size,
          sugar: l.sugar,
          ice: l.ice,
          toppingIds: l.toppings.map((t) => t.id),
          qty: l.qty,
        })),
        couponCode: coupon?.code,
        pointsToUse: totals.points > 0 ? totals.points : undefined,
        note: note.trim() || undefined,
      });
      setPendingOrderId(order.id);
      setDismissed(false);
      setCreated(order);
    } catch (err) {
      setError(errorText(err, "Mất kết nối đến máy chủ. Giỏ hàng của bạn vẫn được giữ, hãy thử lại."));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  /** Bước 2: thanh toán đơn đã tạo. Mỗi lần bấm dùng cùng Idempotency-Key cho tới khi có kết quả. */
  async function pay() {
    const order = activeOrder;
    if (!order || submitting.current || busy) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await api.payments.pay(
        {
          orderId: order.id,
          method,
          simulateFailure: ALLOW_DEMO_FAILURE && simulateFailure ? true : undefined,
        },
        getPaymentKey(order.id, method),
      );

      // Kết quả đã xác định: nếu khách muốn thử giao dịch khác, phải tạo key mới.
      clearPaymentKey(order.id, method);
      if (result.success) {
        clear();
        api.auth.me().then(setUser).catch(() => {});
        router.replace(`/orders/success?id=${order.id}`);
      } else {
        // PAYMENT_FAILED: không xóa giỏ hàng
        router.replace(`/orders/failed?id=${order.id}`);
      }
    } catch (err) {
      setError(
        errorText(
          err,
          "Mất kết nối đến máy chủ. KHÔNG bấm thanh toán liên tục: bấm lại sẽ dùng cùng khóa " +
            "chống trùng, hoặc kiểm tra Lịch sử đơn hàng.",
        ),
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  /** Khách hủy đơn chờ thanh toán: hoàn kho, mã, điểm; giỏ hàng giữ nguyên. */
  async function cancelPending() {
    const order = activeOrder;
    if (!order || submitting.current || busy) return;
    if (!window.confirm(`Hủy đơn ${order.code}? Giỏ hàng của bạn vẫn được giữ.`)) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      await api.orders.cancel(order.id);
      setPendingOrderId(null);
      setCreated(null);
      setDismissed(true);
      api.auth.me().then(setUser).catch(() => {});
    } catch (err) {
      setError(errorText(err, "Mất kết nối đến máy chủ"));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const payStep = activeOrder !== null;

  return (
    <div className={`${container} py-6 sm:py-10`}>
      <Link href="/cart" className="inline-flex min-h-[40px] items-center text-sm font-semibold text-muted hover:text-brand">
        ← Quay lại giỏ hàng
      </Link>
      <h1 className="mt-1 text-2xl font-bold text-ink sm:mt-3 sm:text-[32px]">
        {payStep ? "Thanh toán" : "Xác nhận đơn hàng"}
      </h1>
      <p className="mb-5 mt-1 text-sm text-muted sm:mb-6">
        {payStep
          ? "Bước 2/2 · Đơn đã được tạo và giữ hàng cho bạn. Chọn phương thức rồi thanh toán."
          : "Bước 1/2 · Xem lại đơn, thêm ghi chú nếu cần rồi xác nhận đặt hàng."}
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
        <div className="flex flex-col gap-4 sm:gap-6">
          <section className={card}>
            <h2 className="mb-4 text-lg font-bold text-ink">
              {activeOrder ? `Đơn ${activeOrder.code}` : "Đơn của bạn"}
            </h2>
            <ul className="divide-y divide-line">
              {(activeOrder
                ? activeOrder.items.map((i) => ({
                    key: String(i.id),
                    imageUrl: i.imageUrl,
                    name: i.name,
                    qty: i.qty,
                    total: i.lineTotal,
                    options: describeOptions(i),
                  }))
                : lines.map((l) => ({
                    key: l.key,
                    imageUrl: l.imageUrl,
                    name: l.name,
                    qty: l.qty,
                    total: l.unitPrice * l.qty,
                    options: describeOptions(l),
                  }))
              ).map((row) => (
                <li key={row.key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4">
                  <ProductImage
                    src={row.imageUrl}
                    alt={row.name}
                    className="h-12 w-12 shrink-0 rounded-lg sm:h-14 sm:w-14"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">
                      {row.name} <span className="text-muted">× {row.qty}</span>
                    </p>
                    <p className="text-xs text-muted">{row.options}</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-ink">{vnd(row.total)}</p>
                </li>
              ))}
            </ul>

            {payStep ? (
              activeOrder.note && (
                <p className="mt-4 rounded-lg bg-cream px-4 py-3 text-sm text-muted">
                  Ghi chú: {activeOrder.note}
                </p>
              )
            ) : (
              <div className="mt-4">
                <label htmlFor="checkout-note" className="mb-2 block text-sm font-bold text-ink">
                  Ghi chú cho quầy
                </label>
                <textarea
                  id="checkout-note"
                  rows={2}
                  maxLength={200}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: ít ngọt, cho mình thêm ống hút giấy"
                  className={input}
                />
              </div>
            )}
          </section>

          {payStep && (
            <section className={card}>
              <h2 className="text-lg font-bold text-ink">Phương thức thanh toán</h2>
              <p className="mb-4 text-sm text-muted">Không dùng tiền mặt.</p>
              <div role="radiogroup" className="flex flex-col gap-3">
                {METHODS.map((m) => {
                  const active = method === m.value;
                  return (
                    <label
                      key={m.value}
                      className={`flex min-h-[56px] cursor-pointer items-center gap-3 rounded-xl border p-3 transition sm:gap-4 sm:p-4 ${
                        active ? "border-brand bg-cream" : "border-line hover:border-brand"
                      }`}
                    >
                      <input
                        type="radio"
                        name="method"
                        value={m.value}
                        checked={active}
                        onChange={() => setMethod(m.value)}
                        className="h-5 w-5 accent-[#6F4E37]"
                      />
                      <span>
                        <span className="block font-bold text-ink">{m.title}</span>
                        <span className="block text-xs text-muted">{m.hint}</span>
                      </span>
                    </label>
                  );
                })}
              </div>

              {ALLOW_DEMO_FAILURE && (
                <label className="mt-5 flex cursor-pointer items-start gap-2 rounded-lg border border-dashed border-line px-4 py-3 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#6F4E37]"
                  />
                  <span>
                    <b className="text-ink">Chế độ demo:</b> mô phỏng thanh toán thất bại để xem
                    màn hình lỗi (đơn chuyển sang PAYMENT_FAILED, giỏ hàng được giữ nguyên).
                  </span>
                </label>
              )}
            </section>
          )}
        </div>

        <div className="lg:sticky lg:top-24">
          <OrderSummaryCard
            itemCount={
              activeOrder
                ? activeOrder.items.reduce((n, i) => n + i.qty, 0)
                : totals.itemCount
            }
            subtotal={activeOrder ? activeOrder.subtotal : totals.subtotal}
            couponCode={activeOrder ? activeOrder.couponCode : coupon?.code}
            discount={activeOrder ? activeOrder.discount : totals.discount}
            pointsDiscount={activeOrder ? activeOrder.pointsDiscount : totals.pointsDiscount}
            total={activeOrder ? activeOrder.total : totals.total}
          >
            {blockedBy && (
              <div
                role="alert"
                className="mt-4 rounded-lg bg-[#FFF3D6] px-4 py-3 text-sm text-[#8A5A00]"
              >
                Đơn {blockedBy.code} đang chờ thanh toán nhưng giỏ hàng đã thay đổi. Hãy xem và hủy
                đơn cũ trong{" "}
                <Link href={`/orders/detail?id=${blockedBy.id}`} className="font-bold underline">
                  chi tiết đơn
                </Link>{" "}
                trước khi đặt đơn mới.
              </div>
            )}
            {error && (
              <div
                role="alert"
                className="mt-4 rounded-lg bg-[#FBE7E7] px-4 py-3 text-sm text-danger"
              >
                {error}
              </div>
            )}

            {payStep ? (
              <>
                <button
                  onClick={pay}
                  disabled={busy}
                  className={`${btnPrimary} mt-5 w-full py-4`}
                >
                  {busy ? "Đang xử lý thanh toán..." : `Thanh toán · ${vnd(activeOrder.total)}`}
                </button>
                <button
                  onClick={cancelPending}
                  disabled={busy}
                  className={`${btnOutline} mt-3 w-full`}
                >
                  Hủy đơn này
                </button>
              </>
            ) : (
              <button
                onClick={placeOrder}
                disabled={busy || blockedBy !== null}
                className={`${btnPrimary} mt-5 w-full py-4`}
              >
                {busy ? "Đang tạo đơn..." : `Xác nhận đặt hàng · ${vnd(totals.total)}`}
              </button>
            )}
          </OrderSummaryCard>
        </div>
      </div>
    </div>
  );
}
