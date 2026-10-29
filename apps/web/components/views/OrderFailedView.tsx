"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { btnOutline, btnPrimary, container } from "@/components/ui/classes";
import { ErrorState, Loading } from "@/components/ui/States";
import { api, ApiError } from "@/lib/api";
import { vnd } from "@/lib/format";
import { useApi, useRequireAuth } from "@/lib/hooks";
import { newIdempotencyKey } from "@/lib/idempotency";
import type { Order, PaymentMethod } from "@/lib/types";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "WALLET", label: "Ví điện tử (MoMo)" },
  { value: "CARD", label: "Thẻ ngân hàng (VNPay)" },
];

export default function OrderFailedView({ id }: { id: number }) {
  const router = useRouter();
  const ready = useRequireAuth();
  const setUser = useAuthStore((s) => s.setUser);

  const { data: order, error, loading, reload } = useApi<Order | null>(
    () => (ready ? api.orders.get(id) : Promise.resolve(null)),
    [id, ready],
  );

  const [method, setMethod] = useState<PaymentMethod>("WALLET");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Đơn đã thanh toán / đã xử lý thì không còn là màn hình "thất bại".
  useEffect(() => {
    if (!order) return;
    if (order.status === "PAID") router.replace(`/orders/${order.id}/success`);
    else if (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED")
      router.replace(`/orders/${order.id}`);
  }, [order, router]);

  if (!ready || (loading && !order)) return <Loading />;
  if (error && !order) {
    return (
      <div className={`${container} py-10`}>
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }
  if (!order || (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED")) {
    return <Loading />;
  }

  const reason =
    order.payment?.failureReason ?? "Giao dịch chưa hoàn tất. Bạn chưa bị trừ tiền.";

  async function retry() {
    if (!order || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      // Mỗi lần thử lại là một giao dịch mới nên dùng Idempotency-Key mới
      const res = await api.payments.pay(
        { orderId: order.id, method },
        newIdempotencyKey(),
      );
      if (res.success) {
        const cart = useCartStore.getState();
        if (cart.pendingOrderId === order.id) cart.clear();
        api.auth.me().then(setUser).catch(() => {});
        router.replace(`/orders/${order.id}/success`);
        return;
      }
      setActionError(res.payment.failureReason ?? "Thanh toán chưa thành công");
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra");
    }
    setBusy(false);
  }

  async function cancelOrder() {
    if (!order || busy) return;
    if (!window.confirm(`Hủy đơn ${order.code}? Giỏ hàng của bạn vẫn được giữ.`)) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.orders.cancel(order.id);
      const cart = useCartStore.getState();
      if (cart.pendingOrderId === order.id) cart.setPendingOrderId(null);
      api.auth.me().then(setUser).catch(() => {});
      router.replace("/cart");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra");
      setBusy(false);
    }
  }

  return (
    <div className={`${container} flex justify-center py-12`}>
      <div className="w-full max-w-[560px] rounded-2xl border border-line bg-white p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#FBE7E7] text-danger">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </div>
        <h1 className="text-[28px] font-bold text-ink">Thanh toán chưa thành công</h1>
        <p className="mt-2 text-sm text-muted">{reason}</p>

        <dl className="mt-6 divide-y divide-line rounded-xl bg-cream/60 px-5 text-left text-sm">
          <div className="flex items-center justify-between py-3">
            <dt className="text-muted">Mã đơn</dt>
            <dd className="font-bold text-ink">{order.code}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-muted">Số tiền</dt>
            <dd className="font-bold text-brand">{vnd(order.total)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">
          Giỏ hàng của bạn vẫn được giữ nguyên và chưa bị trừ tiền.
        </p>

        <fieldset className="mt-6 text-left" disabled={busy}>
          <legend className="mb-2 text-sm font-bold text-ink">Thử lại bằng</legend>
          <div className="flex flex-col gap-2 sm:flex-row">
            {METHODS.map((m) => (
              <label
                key={m.value}
                className={`flex flex-1 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold ${
                  method === m.value ? "border-brand bg-cream" : "border-line"
                }`}
              >
                <input
                  type="radio"
                  name="retry-method"
                  checked={method === m.value}
                  onChange={() => setMethod(m.value)}
                  className="accent-[#6F4E37]"
                />
                {m.label}
              </label>
            ))}
          </div>
        </fieldset>

        {actionError && (
          <div role="alert" className="mt-4 rounded-lg bg-[#FBE7E7] px-4 py-3 text-sm text-danger">
            {actionError}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button onClick={retry} disabled={busy} className={`${btnPrimary} w-full py-4`}>
            {busy ? "Đang xử lý..." : `Thử thanh toán lại · ${vnd(order.total)}`}
          </button>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/cart" className={`${btnOutline} flex-1`}>
              Quay lại giỏ hàng
            </Link>
            <button onClick={cancelOrder} disabled={busy} className={`${btnOutline} flex-1`}>
              Hủy đơn này
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
