"use client";

import Link from "next/link";
import { useState } from "react";
import { btnOutline, btnPrimary, card, container } from "@/components/ui/classes";
import OrderSummaryCard from "@/components/ui/OrderSummaryCard";
import ProductImage from "@/components/ui/ProductImage";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import StatusBadge from "@/components/ui/StatusBadge";
import { api, ApiError } from "@/lib/api";
import {
  describeOptions,
  formatDateTime,
  formatTime,
  METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  STATUS_LABEL,
  vnd,
} from "@/lib/format";
import { useApi, useRequireAuth } from "@/lib/hooks";
import type { Order } from "@/lib/types";
import { useAuthStore } from "@/store/auth";

/** Thông điệp theo trạng thái. MVP: không có tiến độ pha chế; đơn PAID chỉ hủy được (hoàn tiền) trong thời hạn. */
function StatusBanner({ order }: { order: Order }) {
  if (order.status === "PAID") {
    return (
      <div className="rounded-lg bg-[#E6F3EA] px-4 py-3 text-sm font-semibold text-[#1E7A43]">
        <p>
          Đơn đã thanh toán và được ghi nhận thành công. Mời tới quầy nhận đồ uống,
          đọc mã đơn {order.code} với nhân viên quầy.
        </p>
        {order.canRefund && order.refundUntil && (
          <p className="mt-1 font-normal">
            Đặt nhầm hoặc đặt dư? Bạn có thể hủy và được hoàn tiền đến{" "}
            {formatTime(order.refundUntil)}.
          </p>
        )}
      </div>
    );
  }
  if (order.status === "PENDING") {
    return (
      <p className="rounded-lg bg-[#FFF3D6] px-4 py-3 text-sm font-semibold text-[#8A5A00]">
        Đơn đang chờ thanh toán. Tồn kho được giữ cho bạn trong thời gian ngắn, đơn chưa thanh
        toán sẽ tự hủy sau 15 phút.
      </p>
    );
  }
  if (order.status === "PAYMENT_FAILED") {
    return (
      <p className="rounded-lg bg-[#FBE7E7] px-4 py-3 text-sm font-semibold text-danger">
        Thanh toán chưa thành công. Bạn có thể thử lại, đổi phương thức hoặc hủy đơn.
      </p>
    );
  }
  if (order.status === "REFUNDED") {
    return (
      <p className="rounded-lg bg-[#E3ECF7] px-4 py-3 text-sm font-semibold text-[#2F5D8C]">
        Đơn đã được hủy và hoàn tiền về {order.payment?.provider ?? "phương thức đã thanh toán"}.
        Tồn kho, mã giảm giá và điểm thưởng đã dùng đã được hoàn lại; điểm đã cộng từ đơn
        này đã được thu hồi.
      </p>
    );
  }
  return (
    <p className="rounded-lg bg-[#EAE3DC] px-4 py-3 text-sm font-semibold text-muted">
      Đơn đã được hủy. Tồn kho, mã giảm giá và điểm thưởng đã dùng đã được hoàn lại.
    </p>
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

  if (!ready || (loading && !order)) return <Loading label="Đang tải đơn hàng..." />;

  if (error && !order) {
    return (
      <div className={`${container} py-6 sm:py-10`}>
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
    if (!window.confirm(`Hủy đơn ${order.code}?`)) return;
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

  /** Hủy đơn đã thanh toán: hoàn tiền về phương thức đã dùng (chỉ trong thời hạn mà server cho phép). */
  async function refund() {
    if (!order || busy) return;
    const via = order.payment
      ? METHOD_LABEL[order.payment.method]
      : "phương thức đã thanh toán";
    if (
      !window.confirm(
        `Hủy đơn ${order.code} và hoàn ${vnd(order.total)} về ${via}? Điểm thưởng đã nhận từ đơn này sẽ bị thu hồi.`,
      )
    )
      return;
    setBusy(true);
    setActionError(null);
    try {
      await api.payments.refund(order.id);
      api.auth.me().then(setUser).catch(() => {});
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra");
      reload(); // cập nhật lại (ví dụ đã hết hạn thì ẩn nút)
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`${container} py-6 sm:py-10`}>
      <Link href="/orders" className="inline-flex min-h-[40px] items-center text-sm font-semibold text-muted hover:text-brand">
        ← Lịch sử đơn hàng
      </Link>

      <div className="mb-5 mt-1 flex flex-wrap items-center gap-x-3 gap-y-2 sm:mb-6 sm:mt-3">
        <h1 className="text-2xl font-bold text-ink sm:text-[32px]">Đơn {order.code}</h1>
        <StatusBadge status={order.status} />
        <span className="text-sm text-muted">{formatDateTime(order.createdAt)}</span>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
        <div className="flex flex-col gap-4 sm:gap-6">
          <section className={card}>
            <StatusBanner order={order} />
          </section>

          <section className={card}>
            <h2 className="mb-4 text-lg font-bold text-ink">Sản phẩm</h2>
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4">
                  <ProductImage
                    src={i.imageUrl}
                    alt={i.name}
                    className="h-14 w-14 shrink-0 rounded-lg sm:h-16 sm:w-16"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">
                      {i.name} <span className="text-muted">× {i.qty}</span>
                    </p>
                    <p className="text-xs text-muted">{describeOptions(i)}</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-ink">{vnd(i.lineTotal)}</p>
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
                    {PAYMENT_STATUS_LABEL[order.payment.status]}
                  </dd>
                </div>
                {order.payment.transactionId && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Mã giao dịch</dt>
                    <dd className="break-all text-right text-ink">{order.payment.transactionId}</dd>
                  </div>
                )}
                {order.payment.failureReason && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Ghi chú</dt>
                    <dd className="text-right text-ink">{order.payment.failureReason}</dd>
                  </div>
                )}
                {order.payment.refundedAt && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Hoàn tiền lúc</dt>
                    <dd className="text-right text-ink">
                      {formatDateTime(order.payment.refundedAt)}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-muted">Đơn chưa được thanh toán.</p>
            )}
          </section>

          <section className={card}>
            <h2 className="mb-4 text-lg font-bold text-ink">Nhật ký trạng thái</h2>
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
            {order.pointsEarned > 0 &&
              order.status !== "CANCELLED" &&
              order.status !== "REFUNDED" && (
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
                href={`/orders/failed?id=${order.id}`}
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
            {order.canRefund && (
              <button
                onClick={refund}
                disabled={busy}
                className={`${btnOutline} mt-3 w-full`}
              >
                {busy ? "Đang hoàn tiền..." : "Hủy và hoàn tiền"}
              </button>
            )}
          </OrderSummaryCard>
        </div>
      </div>
    </div>
  );
}
