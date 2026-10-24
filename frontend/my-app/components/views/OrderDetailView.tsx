"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { btnOutline, btnPrimary, card, container } from "@/components/ui/classes";
import OrderSummaryCard from "@/components/ui/OrderSummaryCard";
import ProductImage from "@/components/ui/ProductImage";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import StatusBadge from "@/components/ui/StatusBadge";
import { api, ApiError } from "@/lib/api";
import {
  describeOptions,
  formatDateTime,
  METHOD_LABEL,
  STATUS_LABEL,
  vnd,
} from "@/lib/format";
import { useApi, useRequireAuth } from "@/lib/hooks";
import type { Order, OrderStatus } from "@/lib/types";
import { useAuthStore } from "@/store/auth";

/** Luồng thành công của đơn (khớp Order State Machine ở backend). */
const FLOW: OrderStatus[] = ["PENDING", "PAID", "PREPARING", "READY", "COMPLETED"];
/** Các trạng thái cần cập nhật tự động vì nhân viên quầy đang xử lý. */
const LIVE: OrderStatus[] = ["PAID", "PREPARING", "READY"];

function Progress({ status }: { status: OrderStatus }) {
  const current = FLOW.indexOf(status);
  if (current === -1) return null; // PAYMENT_FAILED / CANCELLED: chỉ hiện nhãn trạng thái
  return (
    <ol className="flex items-center">
      {FLOW.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  done ? "bg-brand text-white" : "bg-line text-muted"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`text-center text-[11px] font-semibold ${
                  i === current ? "text-brand" : "text-muted"
                }`}
              >
                {STATUS_LABEL[s]}
              </span>
            </div>
            {i < FLOW.length - 1 && (
              <span
                className={`mx-1 mb-5 h-0.5 flex-1 ${i < current ? "bg-brand" : "bg-line"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function OrderDetailView({ id }: { id: number }) {
  const ready = useRequireAuth();
  const setUser = useAuthStore((s) => s.setUser);

  const { data: order, error, loading, reload } = useApi<Order | null>(
    () => (ready ? api.orders.get(id) : Promise.resolve(null)),
    [id, ready],
  );

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Tự làm mới khi đơn đang được cửa hàng xử lý
  const status = order?.status;
  useEffect(() => {
    if (!status || !LIVE.includes(status)) return;
    const timer = setInterval(reload, 8000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (!ready || (loading && !order)) return <Loading label="Đang tải đơn hàng..." />;

  if (error && !order) {
    return (
      <div className={`${container} py-10`}>
        {error.status === 404 ? (
          <EmptyState
            title="Không tìm thấy đơn hàng"
            description="Đơn này không tồn tại hoặc không thuộc tài khoản của bạn."
            href="/orders"
            action="Về lịch sử đơn hàng"
          />
        ) : (
          <ErrorState error={error} onRetry={reload} />
        )}
      </div>
    );
  }
  if (!order) return <Loading />;

  const itemCount = order.items.reduce((n, i) => n + i.qty, 0);
  const canPayAgain = order.status === "PENDING" || order.status === "PAYMENT_FAILED";

  async function cancel() {
    if (!order || busy) return;
    const paid = order.status === "PAID";
    const msg = paid
      ? `Hủy đơn ${order.code}? Khoản đã thanh toán sẽ được hoàn lại.`
      : `Hủy đơn ${order.code}?`;
    if (!window.confirm(msg)) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.orders.cancel(order.id);
      api.auth.me().then(setUser).catch(() => {});
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`${container} py-10`}>
      <Link href="/orders" className="text-sm font-semibold text-muted hover:text-brand">
        ← Lịch sử đơn hàng
      </Link>

      <div className="mb-6 mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-[32px] font-bold text-ink">Đơn {order.code}</h1>
        <StatusBadge status={order.status} />
        <span className="text-sm text-muted">{formatDateTime(order.createdAt)}</span>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          {FLOW.includes(order.status) && (
            <section className={card}>
              <Progress status={order.status} />
              {order.status === "READY" && (
                <p className="mt-4 rounded-lg bg-[#E3EEF9] px-4 py-3 text-sm font-semibold text-[#2B5C8F]">
                  Đồ uống của bạn đã sẵn sàng. Mời tới quầy nhận nhé!
                </p>
              )}
            </section>
          )}

          <section className={card}>
            <h2 className="mb-4 text-lg font-bold text-ink">Sản phẩm</h2>
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <ProductImage
                    src={i.imageUrl}
                    alt={i.name}
                    className="h-16 w-16 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">
                      {i.name} <span className="text-muted">× {i.qty}</span>
                    </p>
                    <p className="text-xs text-muted">{describeOptions(i)}</p>
                  </div>
                  <p className="text-sm font-bold text-ink">{vnd(i.lineTotal)}</p>
                </li>
              ))}
            </ul>
            {order.note && (
              <p className="mt-4 rounded-lg bg-cream px-4 py-3 text-sm text-muted">
                Ghi chú: {order.note}
              </p>
            )}
          </section>

          <section className={card}>
            <h2 className="mb-4 text-lg font-bold text-ink">Thanh toán</h2>
            {order.payment ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Phương thức</dt>
                  <dd className="font-semibold text-ink">
                    {METHOD_LABEL[order.payment.method]}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Kết quả</dt>
                  <dd className="font-semibold text-ink">
                    {{
                      SUCCESS: "Thành công",
                      FAILED: "Thất bại",
                      PENDING: "Đang xử lý",
                      REFUNDED: "Đã hoàn tiền",
                    }[order.payment.status]}
                  </dd>
                </div>
                {order.payment.transactionId && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Mã giao dịch</dt>
                    <dd className="text-ink">{order.payment.transactionId}</dd>
                  </div>
                )}
                {order.payment.failureReason && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Ghi chú</dt>
                    <dd className="text-right text-ink">{order.payment.failureReason}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-muted">Đơn chưa được thanh toán.</p>
            )}
          </section>

          <section className={card}>
            <h2 className="mb-4 text-lg font-bold text-ink">Lịch sử trạng thái</h2>
            <ol className="relative ml-2 border-l border-line pl-6">
              {order.timeline.map((t, idx) => (
                <li key={`${t.status}-${idx}`} className="relative pb-5 last:pb-0">
                  <span
                    className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ${
                      idx === order.timeline.length - 1 ? "bg-brand" : "bg-line"
                    }`}
                  />
                  <p className="text-sm font-bold text-ink">{STATUS_LABEL[t.status]}</p>
                  <p className="text-xs text-muted">{formatDateTime(t.at)}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="lg:sticky lg:top-24">
          <OrderSummaryCard
            itemCount={itemCount}
            subtotal={order.subtotal}
            couponCode={order.couponCode}
            discount={order.discount}
            pointsDiscount={order.pointsDiscount}
            total={order.total}
          >
            {order.pointsEarned > 0 && order.status !== "CANCELLED" && (
              <p className="mt-3 text-xs font-semibold text-ok">
                {order.pointsAwarded
                  ? `Bạn đã nhận +${order.pointsEarned} điểm thưởng từ đơn này.`
                  : `Bạn sẽ nhận +${order.pointsEarned} điểm thưởng khi thanh toán thành công.`}
              </p>
            )}
            {actionError && (
              <div role="alert" className="mt-4 rounded-lg bg-[#FBE7E7] px-4 py-3 text-sm text-danger">
                {actionError}
              </div>
            )}
            {canPayAgain && (
              <Link
                href={`/orders/${order.id}/failed`}
                className={`${btnPrimary} mt-5 w-full py-4`}
              >
                Thanh toán đơn này
              </Link>
            )}
            {order.canCancel && (
              <button
                onClick={cancel}
                disabled={busy}
                className={`${btnOutline} mt-3 w-full`}
              >
                {busy ? "Đang hủy..." : "Hủy đơn"}
              </button>
            )}
          </OrderSummaryCard>
        </div>
      </div>
    </div>
  );
}
