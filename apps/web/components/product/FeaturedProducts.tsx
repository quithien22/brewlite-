"use client";

import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { api } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import ProductCard from "./ProductCard";

/** Lưới món nổi bật ở trang chủ (gọi GET /products?featured=true). */
export default function FeaturedProducts() {
  const { data, error, loading, reload } = useApi(
    () => api.products.list({ featured: true }),
    [],
  );

  if (loading && !data) return <Loading label="Đang tải món nổi bật..." />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Thực đơn đang được cập nhật"
        description="Bạn quay lại sau ít phút nhé."
        href="/menu"
        action="Xem thực đơn"
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {data.slice(0, 4).map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
