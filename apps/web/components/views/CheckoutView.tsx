"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { btnPrimary, card, container } from "@/components/ui/classes";
import OrderSummaryCard from "@/components/ui/OrderSummaryCard";
import ProductImage from "@/components/ui/ProductImage";
import { EmptyState, Loading } from "@/components/ui/States";
import { api, ApiError } from "@/lib/api";
import { calcCartTotals } from "@/lib/cart-totals";
import { describeOptions, vnd } from "@/lib/format";
import { useRequireAuth } from "@/lib/hooks";
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
    (order.couponCode ?? '').toUpperCase() === (couponCode ?? '').toUpperCase() &&
    order.pointsUsed === pointsUsed &&
    (order.note ?? '').trim() === note.trim()
  );
}

// Dùng lại key khi request trả lỗi mạng: tránh gọi cổng thanh toán hai lần.
const IDEMPOTENCY_PREFIX = 'brewlite-mock-payment:';
const ALLOW_DEMO_FAILURE =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_ALLOW_MOCK_FAILURE === 'true';

export default function CheckoutView() {
  const router = useRouter();
  const ready = useRequireAuth();

  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const cartHydrated = useCartStore((s) => s.hydrated);
  const lines = useCartStore((s) => s.lines);
  const note = useCartStore((s) => s.note);
  const coupon = useCartStore((s) => s.coupon);
  const pointsToUse = useCartStore((s) => s.pointsToUse);
  const pendingOrderId = useCartStore((s) => s.pendingOrderId);
  const setPendingOrderId = useCartStore((s) => s.setPendingOrderId);
  const clear = useCartStore((s) => s.clear);

  const [method, setMethod] = useState<PaymentMethod>("WALLET");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const memoryKeys = useRef(new Map<string, string>());

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

  if (!ready || !cartHydrated) return <Loading />;

  if (lines.length === 0) {
    return (
      <div className={`${container} py-10`}>
        <EmptyState
          title="Chưa có gì để thanh toán"
          description="Giỏ hàng của bạn đang trống. Chọn đồ uống trước nhé."
          href="/menu"
          action="Xem thực đơn"
        />
      </div>
    );
  }

  const totals = calcCartTotals(lines, coupon, pointsToUse, user?.loyaltyPoints ?? 0);

  async function confirm() {
    if (submitting.current || busy) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      let order: Order;
      if (pendingOrderId !== null) {
        // Không tự động hủy đơn cũ rồi tạo đơn mới: request thanh toán
        // trước đó có thể đã thành công nhưng client chưa nhận phản hồi.
        order = await api.orders.get(pendingOrderId);
        if (order.status === 'PAID') {
          clear();
          router.replace(`/orders/${order.id}/success`);
          return;
        }
        if (order.status === 'PAYMENT_FAILED') {
          router.replace(`/orders/${order.id}/failed`);
          return;
        }
        if (order.status === 'CANCELLED') {
          setPendingOrderId(null);
          // Chỉ tạo đơn mới sau khi xác nhận đơn trước đã bị hủy.
          order = await api.orders.create({
            items: lines.map((l) => ({
              productId: l.productId, size: l.size, sugar: l.sugar,
              ice: l.ice, toppingIds: l.toppings.map((t) => t.id), qty: l.qty,
            })),
            couponCode: coupon?.code,
            pointsToUse: totals.points > 0 ? totals.points : undefined,
            note: note.trim() || undefined,
          });
          setPendingOrderId(order.id);
        } else if (order.status !== 'PENDING') {
          clear();
          router.replace(`/orders/${order.id}`);
          return;
        } else if (!matchesCart(order, lines, coupon?.code, totals.points, note)) {
          throw new Error(
            `Đơn ${order.code} đang chờ thanh toán nhưng giỏ hàng đã thay đổi. ` +
            'Hãy xem và hủy đơn cũ trong Lịch sử đơn hàng trước khi đặt đơn mới.',
          );
        }
      } else {
        // Tạo đơn ở PENDING, mọi giá/giảm giá phải được tính lại tại backend.
        order = await api.orders.create({
          items: lines.map((l) => ({
            productId: l.productId, size: l.size, sugar: l.sugar,
            ice: l.ice, toppingIds: l.toppings.map((t) => t.id), qty: l.qty,
          })),
          couponCode: coupon?.code,
          pointsToUse: totals.points > 0 ? totals.points : undefined,
          note: note.trim() || undefined,
        });
        setPendingOrderId(order.id);
      }

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
        router.replace(`/orders/${order.id}/success`);
      } else {
        // Trạng thái PAYMENT_FAILED: không xóa giỏ hàng
        router.replace(`/orders/${order.id}/failed`);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.isNetwork
            ? 'Mất kết nối đến server. KHÔNG bấm đặt lại liên tục. ' +
              'Hãy kiểm tra Lịch sử đơn hàng hoặc thử lại với yêu cầu hiện tại.'
            : err.message
          : err instanceof Error ? err.message : 'Đã xảy ra lỗi',
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <div className={`${container} py-10`}>
      <Link href="/cart" className="text-sm font-semibold text-muted hover:text-brand">
        ← Quay lại giỏ hàng
      </Link>
      <h1 className="mb-6 mt-3 text-[32px] font-bold text-ink">Thanh toán</h1>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <section className={card}>
            <h2 className="mb-4 text-lg font-bold text-ink">Đơn của bạn</h2>
            <ul className="divide-y divide-line">
              {lines.map((l) => (
                <li key={l.key} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <ProductImage
                    src={l.imageUrl}
                    alt={l.name}
                    className="h-14 w-14 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">
                      {l.name} <span className="text-muted">× {l.qty}</span>
                    </p>
                    <p className="text-xs text-muted">{describeOptions(l)}</p>
                  </div>
                  <p className="text-sm font-bold text-ink">{vnd(l.unitPrice * l.qty)}</p>
                </li>
              ))}
            </ul>
            {note.trim() && (
              <p className="mt-4 rounded-lg bg-cream px-4 py-3 text-sm text-muted">
                Ghi chú: {note.trim()}
              </p>
            )}
          </section>

          <section className={card}>
            <h2 className="text-lg font-bold text-ink">Phương thức thanh toán</h2>
            <p className="mb-4 text-sm text-muted">Không dùng tiền mặt.</p>
            <div role="radiogroup" className="flex flex-col gap-3">
              {METHODS.map((m) => {
                const active = method === m.value;
                return (
                  <label
                    key={m.value}
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${
                      active ? "border-brand bg-cream" : "border-line hover:border-brand"
                    }`}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={m.value}
                      checked={active}
                      onChange={() => setMethod(m.value)}
                      className="h-4 w-4 accent-[#6F4E37]"
                    />
                    <span>
                      <span className="block font-bold text-ink">{m.title}</span>
                      <span className="block text-xs text-muted">{m.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            {ALLOW_DEMO_FAILURE && <label className="mt-5 flex cursor-pointer items-start gap-2 rounded-lg border border-dashed border-line px-4 py-3 text-xs text-muted">
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
            </label>}
          </section>
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
            {error && (
              <div
                role="alert"
                className="mt-4 rounded-lg bg-[#FBE7E7] px-4 py-3 text-sm text-danger"
              >
                {error}
              </div>
            )}
            <button
              onClick={confirm}
              disabled={busy}
              className={`${btnPrimary} mt-5 w-full py-4`}
            >
              {busy ? "Đang xử lý thanh toán..." : `Xác nhận thanh toán · ${vnd(totals.total)}`}
            </button>
          </OrderSummaryCard>
        </div>
      </div>
    </div>
  );
}
