"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import { container, input } from "@/components/ui/classes";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { api } from "@/lib/api";
import { useApi } from "@/lib/hooks";

export default function MenuView() {
  const router = useRouter();
  const params = useSearchParams();
  const category = params.get("category") ?? "";
  const [search, setSearch] = useState(params.get("q") ?? "");

  const { data, error, loading, reload } = useApi(
    () => api.products.list({}),
    [],
  );

  const categories = useMemo(
    () => [...new Set((data ?? []).map((p) => p.category))],
    [data],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter(
      (p) =>
        (!category || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q)),
    );
  }, [data, category, search]);

  function pickCategory(c: string) {
    router.replace(c ? `/menu?category=${encodeURIComponent(c)}` : "/menu", {
      scroll: false,
    });
  }

  return (
    <div className={`${container} py-10`}>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-ink">Thực đơn</h1>
          <p className="mt-1 text-sm text-muted">
            Chọn món, chọn size và topping — thanh toán không tiền mặt chỉ trong vài chạm.
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm đồ uống..."
          aria-label="Tìm đồ uống"
          className={`${input} md:max-w-xs`}
        />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {["", ...categories].map((c) => {
          const active = c === category;
          return (
            <button
              key={c || "all"}
              onClick={() => pickCategory(c)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-ink hover:border-brand"
              }`}
            >
              {c || "Tất cả"}
            </button>
          );
        })}
      </div>

      {loading && !data ? (
        <Loading label="Đang tải thực đơn..." />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : visible.length === 0 ? (
        <EmptyState
          title="Không tìm thấy đồ uống"
          description="Thử đổi từ khóa hoặc chọn danh mục khác nhé."
          href="/menu"
          action="Xem tất cả"
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
