"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { btnOutline, btnPrimary, container } from "@/components/ui/classes";
import { ErrorState, Loading } from "@/components/ui/States";
import StatusBadge from "@/components/ui/StatusBadge";
import { api } from "@/lib/api";
import { formatDateTime, METHOD_LABEL, STORE, vnd } from "@/lib/format";
import { useApi, useRequireAuth } from "@/lib/hooks";
import type { Order } from "@/lib/types";

export default function OrderSuccessView({ id }: { id: number }) {
  const router = useRouter();
  const ready = useRequireAuth();
  const { data: order, error, loading, reload } = useApi<Order | null>(
    () => (ready ? api.orders.get(id) : Promise.resolve(null)),
    [id, ready],
  );

  // Đơn chưa thanh toán xong thì không thuộc màn hình "thành công"
  useEffect(() => {
    if (!order) return;
    if (order.status === "PENDING" || order.status === "PAYMENT_FAILED") {
      router.replace(`/orders/${order.id}/failed`);
    } else if (order.status === "CANCELLED") {
      router.replace(`/orders/${order.id}`);
    }
  }, [order, router]);

  if (!ready || (loading && !order)) return <Loading />;
  if (error && !order) {
    return (
      <div className={`${container} py-10`}>
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }
  if (!order || order.status === "PENDING" || order.status === "PAYMENT_FAILED") {
    return <Loading />;
  }

  return (
    <div className={`${container} flex justify-center py-12`}>
      <div className="w-full max-w-[560px] rounded-2xl border border-line bg-white p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#E6F3EA] text-ok">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-[28px] font-bold text-ink">Đặt hàng thành công</h1>
        <p className="mt-2 text-sm text-muted">
          Cảm ơn bạn! Chúng mình đã nhận được thanh toán và đang chuẩn bị đồ uống.
        </p>

        <dl className="mt-6 divide-y divide-line rounded-xl bg-cream/60 px-5 text-left text-sm">
          <div className="flex items-center justify-between py-3">
            <dt className="text-muted">Mã đơn</dt>
            <dd className="text-lg font-bold text-brand">{order.code}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-muted">Trạng thái</dt>
            <dd>
              <StatusBadge status={order.status} />
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-muted">Tổng thanh toán</dt>
            <dd className="font-bold text-ink">{vnd(order.total)}</dd>
          </div>
          {order.payment && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-muted">Phương thức</dt>
              <dd className="font-semibold text-ink">
                {METHOD_LABEL[order.payment.method]}
                {order.payment.transactionId && (
                  <span className="ml-2 text-xs font-normal text-muted">
                    {order.payment.transactionId}
                  </span>
                )}
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between py-3">
            <dt className="text-muted">Thời gian</dt>
            <dd className="text-ink">{formatDateTime(order.createdAt)}</dd>
          </div>
          {order.pointsEarned > 0 && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-muted">Điểm thưởng nhận được</dt>
              <dd className="font-bold text-ok">+{order.pointsEarned} điểm</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 rounded-xl border border-line px-5 py-4 text-sm">
          <p className="font-bold text-ink">Mời tới quầy lấy nước</p>
          <p className="mt-1 text-muted">
            {STORE.name} · {STORE.address}
          </p>
          <p className="mt-1 text-muted">Đọc mã đơn {order.code} với nhân viên quầy.</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={`/orders/${order.id}`} className={`${btnPrimary} flex-1`}>
            Xem chi tiết đơn
          </Link>
          <Link href="/" className={`${btnOutline} flex-1`}>
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
