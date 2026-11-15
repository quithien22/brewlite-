"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnOutline, btnPrimary, container } from "@/components/ui/classes";
import { ErrorState, Loading } from "@/components/ui/States";
import { api } from "@/lib/api";
import { formatDate, vnd } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Promotion } from "@/lib/types";
import { useCartStore } from "@/store/cart";

const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    code: "CHAO10",
    title: "Ly đầu tiên giảm 10%",
    description: "Dành cho khách hàng mới. Áp dụng cho đơn từ 50.000đ.",
    type: "PERCENT",
    value: 10,
    minOrder: 50000,
    maxDiscount: 20000,
    endsAt: "2027-12-31T23:59:59.000Z",
  },
  {
    code: "GIAM15K",
    title: "Giảm 15.000đ cho đơn từ 100.000đ",
    description: "Uống cùng bạn bè, tiết kiệm nhiều hơn.",
    type: "FIXED",
    value: 15000,
    minOrder: 100000,
    maxDiscount: null,
    endsAt: "2027-12-31T23:59:59.000Z",
  },
  {
    code: "COMBO20",
    title: "Giảm 20% cho đơn từ 150.000đ",
    description: "Tối đa 40.000đ. Số lượng có hạn.",
    type: "PERCENT",
    value: 20,
    minOrder: 150000,
    maxDiscount: 40000,
    endsAt: "2027-12-31T23:59:59.000Z",
  },
];

function benefit(p: Promotion) {
  if (p.type === "PERCENT") {
    return p.maxDiscount
      ? `Giảm ${p.value}% · tối đa ${vnd(p.maxDiscount)}`
      : `Giảm ${p.value}%`;
  }
  return `Giảm ${vnd(p.value)}`;
}

function PromoCard({ promo }: { promo: Promotion }) {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const coupon = useCartStore((s) => s.coupon);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const [copied, setCopied] = useState(false);

  const isApplied = coupon?.code === promo.code;

  async function copy() {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* trình duyệt chặn clipboard: khách vẫn đọc được mã trên thẻ */
    }
  }

  function handleUseNow() {
    setCoupon({
      code: promo.code,
      title: promo.title,
      discount: 0,
    });
    if (lines.length > 0) {
      router.push("/cart");
    } else {
      router.push("/menu");
    }
  }

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-white p-5 sm:p-6 transition hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <span className="w-max rounded-full bg-cream px-3 py-1 text-xs font-bold text-brand">
          {benefit(promo)}
        </span>
        {isApplied && (
          <span className="rounded-full bg-[#E6F3EA] px-2.5 py-0.5 text-xs font-bold text-[#1E7A43]">
            ✓ Đang dùng trong giỏ
          </span>
        )}
      </div>

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

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-dashed border-brand/60 bg-cream/30 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <span className="break-all font-mono text-base font-bold tracking-wider text-brand sm:text-lg">
            {promo.code}
          </span>
          <button
            type="button"
            onClick={copy}
            className="text-xs font-semibold text-muted hover:text-brand hover:underline"
            title="Sao chép mã"
          >
            {copied ? "Đã chép ✓" : "Sao chép"}
          </button>
        </div>

        <button
          type="button"
          onClick={handleUseNow}
          className={`${btnPrimary} py-2.5 px-4 text-xs font-bold w-full sm:w-auto shrink-0 ${
            isApplied ? "!bg-[#1E7A43] hover:!bg-[#1E7A43]/90" : ""
          }`}
        >
          {isApplied
            ? "Đến giỏ hàng →"
            : lines.length > 0
              ? "Áp dụng vào giỏ →"
              : "Dùng mã ngay →"}
        </button>
      </div>
    </article>
  );
}

export default function PromotionsView() {
  const { data, error, loading, reload } = useApi(
    () => api.promotions.list().catch(() => []),
    [],
  );

  const promos = data && data.length > 0 ? data : DEFAULT_PROMOTIONS;

  return (
    <div className={`${container} py-6 sm:py-10`}>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-[32px]">Khuyến mãi</h1>
          <p className="mt-1 text-sm text-muted">
            Chọn ưu đãi và áp dụng trực tiếp vào đơn hàng chỉ với 1 chạm.
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
      ) : error && !data && promos.length === 0 ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {promos.map((p) => (
            <PromoCard key={p.code} promo={p} />
          ))}
        </div>
      )}
    </div>
  );
}
