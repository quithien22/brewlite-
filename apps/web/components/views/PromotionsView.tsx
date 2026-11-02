"use client";

import Link from "next/link";
import { useState } from "react";
import { btnOutline, btnPrimary, container } from "@/components/ui/classes";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { api } from "@/lib/api";
import { formatDate, vnd } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Promotion } from "@/lib/types";

function benefit(p: Promotion) {
  if (p.type === "PERCENT") {
    return p.maxDiscount
      ? `Giảm ${p.value}% · tối đa ${vnd(p.maxDiscount)}`
      : `Giảm ${p.value}%`;
  }
  return `Giảm ${vnd(p.value)}`;
}

function PromoCard({ promo }: { promo: Promotion }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* trình duyệt chặn clipboard: khách vẫn đọc được mã trên thẻ */
    }
  }

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-white p-5 sm:p-6">
      <span className="w-max rounded-full bg-cream px-3 py-1 text-xs font-bold text-brand">
        {benefit(promo)}
      </span>
      <h2 className="mt-4 text-xl font-bold text-ink">{promo.title}</h2>
      <p className="mt-2 flex-1 text-sm text-muted">{promo.description}</p>

      <dl className="mt-4 space-y-1 text-xs text-muted">
        <div className="flex justify-between">
          <dt>Đơn tối thiểu</dt>
          <dd className="font-semibold text-ink">
            {promo.minOrder > 0 ? vnd(promo.minOrder) : "Không yêu cầu"}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Hạn dùng</dt>
          <dd className="font-semibold text-ink">{formatDate(promo.endsAt)}</dd>
        </div>
      </dl>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-dashed border-brand px-4 py-3">
        <span className="break-all font-mono text-base font-bold tracking-wider text-brand sm:text-lg">
          {promo.code}
        </span>
        <button onClick={copy} className="min-h-[44px] shrink-0 px-2 text-sm font-bold text-brand hover:underline">
          {copied ? "Đã sao chép ✓" : "Sao chép"}
        </button>
      </div>
    </article>
  );
}

export default function PromotionsView() {
  const { data, error, loading, reload } = useApi(
    () => api.promotions.list(),
    [],
  );

  return (
    <div className={`${container} py-6 sm:py-10`}>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-[32px]">Khuyến mãi</h1>
          <p className="mt-1 text-sm text-muted">
            Sao chép mã và nhập ở bước giỏ hàng để nhận ưu đãi.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/menu" className={`${btnPrimary} flex-1 sm:flex-none`}>
            Đặt món ngay
          </Link>
          <Link href="/cart" className={`${btnOutline} flex-1 sm:flex-none`}>
            Xem giỏ hàng
          </Link>
        </div>
      </div>

      {loading && !data ? (
        <Loading label="Đang tải khuyến mãi..." />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Hiện chưa có khuyến mãi"
          description="Quay lại sau nhé, chúng mình luôn có ưu đãi mới cho bạn."
          href="/menu"
          action="Xem thực đơn"
        />
      ) : (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <PromoCard key={p.code} promo={p} />
          ))}
        </div>
      )}
    </div>
  );
}
