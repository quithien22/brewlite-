"use client";

import Link from "next/link";
import { useState } from "react";
import { btnOutline, btnPrimary, card, container, input } from "@/components/ui/classes";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import StatusBadge from "@/components/ui/StatusBadge";
import { api } from "@/lib/api";
import { formatDateTime, STATUS_LABEL, vnd } from "@/lib/format";
import { useApi, useRequireAuth } from "@/lib/hooks";
import type { OrderPage, OrderStatus } from "@/lib/types";

const PAGE_SIZE = 6;
const STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[];

export default function OrdersView() {
  const ready = useRequireAuth();

  const [status, setStatus] = useState<OrderStatus | "">("");
  const [month, setMonth] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, error, loading, reload } = useApi<OrderPage | null>(
    () =>
      ready
        ? api.orders.mine({
            status: status || undefined,
            month: month || undefined,
            search: search || undefined,
            page,
            pageSize: PAGE_SIZE,
          })
        : Promise.resolve(null),
    [ready, status, month, search, page],
  );

  const filtering = Boolean(status || month || search);

  function resetFilters() {
    setStatus("");
    setMonth("");
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  if (!ready) return <Loading />;

  return (
    <div className={`${container} py-10`}>
      <h1 className="text-[32px] font-bold text-ink">Lịch sử đơn hàng</h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        Theo dõi trạng thái và xem lại các đơn bạn đã đặt.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchInput.trim());
          setPage(1);
        }}
        className={`${card} mb-6 grid gap-3 p-4 md:grid-cols-[1fr_200px_180px_auto]`}
      >
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo mã đơn, ví dụ #1042"
          aria-label="Tìm theo mã đơn"
          className={input}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus | "");
            setPage(1);
          }}
          aria-label="Lọc theo trạng thái"
          className={input}
        >
          <option value="">Tất cả trạng thái</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <input
          type="month"
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            setPage(1);
          }}
          aria-label="Lọc theo tháng"
          className={input}
        />
        <button className={btnPrimary}>Tìm</button>
      </form>

      {loading && !data ? (
        <Loading label="Đang tải đơn hàng..." />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data || data.items.length === 0 ? (
        filtering ? (
          <div className="rounded-2xl border border-line bg-white px-6 py-14 text-center">
            <h2 className="text-xl font-bold text-ink">Không có đơn nào khớp bộ lọc</h2>
            <p className="mt-2 text-sm text-muted">Thử bỏ bớt điều kiện lọc nhé.</p>
            <button onClick={resetFilters} className={`${btnOutline} mt-5`}>
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <EmptyState
            title="Bạn chưa có đơn hàng nào"
            description="Đặt ly đầu tiên và đơn của bạn sẽ xuất hiện ở đây."
            href="/menu"
            action="Xem thực đơn"
          />
        )
      ) : (
        <>
          <ul className={`flex flex-col gap-4 ${loading ? "opacity-60" : ""}`}>
            {data.items.map((o) => {
              const summary = o.items.map((i) => `${i.name} × ${i.qty}`).join(", ");
              return (
                <li key={o.id}>
                  <Link
                    href={`/orders/${o.id}`}
                    className={`${card} flex flex-col gap-3 p-5 transition hover:border-brand sm:flex-row sm:items-center sm:justify-between`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-ink">{o.code}</span>
                        <StatusBadge status={o.status} />
                      </div>
                      <p className="mt-1 truncate text-sm text-muted">{summary}</p>
                      <p className="mt-1 text-xs text-muted">{formatDateTime(o.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-lg font-bold text-brand">{vnd(o.total)}</span>
                      <span className="text-sm font-bold text-brand">Chi tiết →</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {data.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className={btnOutline}
              >
                ← Trước
              </button>
              <span className="text-sm text-muted">
                Trang {data.page} / {data.totalPages}
              </span>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className={btnOutline}
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
