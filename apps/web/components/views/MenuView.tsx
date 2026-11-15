"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import { container, input } from "@/components/ui/classes";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { api } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type { Product } from "@/lib/types";

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Cà phê sữa",
    description: "Cà phê phin đậm vị, hòa cùng sữa đặc béo ngọt.",
    category: "Cà phê",
    price: 35000,
    imageUrl:
      "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
    stock: 80,
    inStock: true,
    isFeatured: true,
  },
  {
    id: 2,
    name: "Americano",
    description: "Espresso pha loãng, hậu vị sạch và thanh.",
    category: "Cà phê",
    price: 40000,
    imageUrl:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    stock: 60,
    inStock: true,
    isFeatured: false,
  },
  {
    id: 3,
    name: "Cappuccino",
    description: "Espresso, sữa nóng và lớp bọt sữa mịn như mây.",
    category: "Cà phê",
    price: 45000,
    imageUrl:
      "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80",
    stock: 60,
    inStock: true,
    isFeatured: true,
  },
  {
    id: 4,
    name: "Latte",
    description: "Espresso êm dịu với nhiều sữa tươi, vị ngọt tự nhiên.",
    category: "Cà phê",
    price: 48000,
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
    stock: 50,
    inStock: true,
    isFeatured: false,
  },
  {
    id: 5,
    name: "Bạc xỉu",
    description: "Nhiều sữa, ít cà phê — ngọt dịu cho buổi chiều.",
    category: "Cà phê",
    price: 38000,
    imageUrl:
      "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
    stock: 70,
    inStock: true,
    isFeatured: false,
  },
  {
    id: 6,
    name: "Trà đào",
    description: "Trà đen thơm, đào miếng giòn mát, vị chua ngọt cân bằng.",
    category: "Trà trái cây",
    price: 39000,
    imageUrl:
      "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80",
    stock: 70,
    inStock: true,
    isFeatured: true,
  },
  {
    id: 7,
    name: "Trà vải",
    description: "Trà hoa nhài kết hợp vải thiều tươi mát.",
    category: "Trà trái cây",
    price: 39000,
    imageUrl:
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80",
    stock: 50,
    inStock: true,
    isFeatured: false,
  },
  {
    id: 8,
    name: "Trà chanh mật ong",
    description: "Chanh tươi, mật ong và trà xanh — nhẹ người, tỉnh táo.",
    category: "Trà trái cây",
    price: 35000,
    imageUrl:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
    stock: 50,
    inStock: true,
    isFeatured: false,
  },
  {
    id: 9,
    name: "Trà sữa trân châu",
    description: "Trà sữa đậm vị cùng trân châu đen dai mềm.",
    category: "Trà sữa",
    price: 42000,
    imageUrl:
      "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=800&q=80",
    stock: 90,
    inStock: true,
    isFeatured: true,
  },
  {
    id: 10,
    name: "Trà sữa matcha",
    description: "Matcha Nhật xay mịn, béo nhẹ và thơm dịu.",
    category: "Trà sữa",
    price: 48000,
    imageUrl:
      "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80",
    stock: 40,
    inStock: true,
    isFeatured: false,
  },
  {
    id: 11,
    name: "Cacao đá xay",
    description: "Cacao đậm đà xay lạnh, phủ kem tươi.",
    category: "Đá xay",
    price: 52000,
    imageUrl:
      "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
    stock: 30,
    inStock: true,
    isFeatured: false,
  },
  {
    id: 12,
    name: "Cold brew cam",
    description:
      "Cà phê ủ lạnh 18 giờ với lát cam tươi. (Hết hàng — dùng để thử trạng thái hết hàng)",
    category: "Cà phê",
    price: 52000,
    imageUrl:
      "https://images.unsplash.com/photo-1770282184909-955dd7764a37?auto=format&fit=crop&w=800&q=80",
    stock: 0,
    inStock: false,
    isFeatured: false,
  },
];

export default function MenuView() {
  const router = useRouter();
  const params = useSearchParams();
  const category = params.get("category") ?? "";
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortOrder, setSortOrder] = useState<
    "default" | "price-asc" | "price-desc"
  >("default");

  const { data, error, loading, reload } = useApi(
    () => api.products.list({}),
    [],
  );

  const products = useMemo(() => {
    if (data && data.length > 0) return data;
    return DEFAULT_PRODUCTS;
  }, [data]);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))],
    [products],
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: products.length,
    };
    for (const p of products) {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    }
    return counts;
  }, [products]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (category && p.category !== category) return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (onlyFeatured && !p.isFeatured) return false;
      if (onlyInStock && !p.inStock) return false;
      return true;
    });

    if (sortOrder === "price-asc") {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortOrder === "price-desc") {
      return [...list].sort((a, b) => b.price - a.price);
    }
    return list;
  }, [products, category, search, onlyFeatured, onlyInStock, sortOrder]);

  const hasActiveFilters = Boolean(
    category ||
      search.trim() ||
      onlyFeatured ||
      onlyInStock ||
      sortOrder !== "default",
  );

  function resetFilters() {
    setSearch("");
    setOnlyFeatured(false);
    setOnlyInStock(false);
    setSortOrder("default");
    router.replace("/menu", { scroll: false });
  }

  function pickCategory(c: string) {
    router.replace(c ? `/menu?category=${encodeURIComponent(c)}` : "/menu", {
      scroll: false,
    });
  }

  return (
    <div className={`${container} py-6 sm:py-10`}>
      {/* Header & Search */}
      <div className="mb-5 flex flex-col gap-4 sm:mb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-[32px]">Thực đơn</h1>
          <p className="mt-1 text-sm text-muted">
            Chọn món, chọn size và topping — thanh toán không tiền mặt chỉ trong vài chạm.
          </p>
        </div>

        {/* Ô tìm kiếm thông minh */}
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            inputMode="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên đồ uống..."
            aria-label="Tìm đồ uống"
            className={`${input} pr-10 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-cream text-xs font-bold text-muted transition hover:bg-line hover:text-ink cursor-pointer"
              aria-label="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Row 1: Danh mục có gắn số lượng món */}
      <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mb-4 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        <button
          onClick={() => pickCategory("")}
          className={`min-h-[40px] shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition cursor-pointer ${
            !category
              ? "border-brand bg-brand text-white shadow-xs"
              : "border-line bg-white text-ink hover:border-brand"
          }`}
        >
          Tất cả ({categoryCounts.all ?? 0})
        </button>
        {categories.map((c) => {
          const active = c === category;
          return (
            <button
              key={c}
              onClick={() => pickCategory(c)}
              className={`min-h-[40px] shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition cursor-pointer ${
                active
                  ? "border-brand bg-brand text-white shadow-xs"
                  : "border-line bg-white text-ink hover:border-brand"
              }`}
            >
              {c} ({categoryCounts[c] ?? 0})
            </button>
          );
        })}
      </div>

      {/* Row 2: Bộ lọc thông minh & Sắp xếp giá */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cream/40 border border-line/60 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted uppercase tracking-wider hidden sm:inline mr-1">
            Lọc theo:
          </span>

          {/* Toggle Món bán chạy */}
          <button
            type="button"
            onClick={() => setOnlyFeatured((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              onlyFeatured
                ? "border-brand bg-brand text-white shadow-xs"
                : "border-line bg-white text-ink hover:border-brand"
            }`}
          >
            <span>🔥</span>
            <span>Món bán chạy</span>
          </button>

          {/* Toggle Chỉ món còn hàng */}
          <button
            type="button"
            onClick={() => setOnlyInStock((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              onlyInStock
                ? "border-[#1E7A43] bg-[#1E7A43] text-white shadow-xs"
                : "border-line bg-white text-ink hover:border-brand"
            }`}
          >
            <span>✓</span>
            <span>Chỉ món còn hàng</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          {/* Dropdown sắp xếp theo giá */}
          <select
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(
                e.target.value as "default" | "price-asc" | "price-desc",
              )
            }
            className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand focus:outline-none cursor-pointer"
            aria-label="Sắp xếp theo giá"
          >
            <option value="default">Sắp xếp: Mặc định</option>
            <option value="price-asc">Giá: Thấp → Cao</option>
            <option value="price-desc">Giá: Cao → Thấp</option>
          </select>

          {/* Nút xóa bộ lọc */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-bold text-muted hover:text-danger hover:underline cursor-pointer px-1 py-1"
            >
              Xóa bộ lọc ✕
            </button>
          )}
        </div>
      </div>

      {/* Hiển thị số lượng món tìm thấy */}
      <div className="mb-4 flex items-center justify-between text-xs text-muted font-medium">
        <span>
          Đang hiển thị <strong className="text-ink">{visible.length}</strong> món đồ uống
        </span>
      </div>

      {loading && !data && products.length === 0 ? (
        <Loading label="Đang tải thực đơn..." />
      ) : error && !data && products.length === 0 ? (
        <ErrorState error={error} onRetry={reload} />
      ) : visible.length === 0 ? (
        <EmptyState
          title="Không tìm thấy đồ uống phù hợp"
          description="Thử đổi từ khóa hoặc xóa bớt bộ lọc để xem các món khác nhé."
          href="/menu"
          action="Xem tất cả thực đơn"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
