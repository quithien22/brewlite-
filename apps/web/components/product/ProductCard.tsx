import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import { vnd } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const isOutOfStock = !product.inStock;

  return (
    <Link
      href={`/menu/detail?id=${product.id}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white transition hover:shadow-md ${
        isOutOfStock ? "border-line/70 bg-gray-50/50" : "border-line"
      }`}
    >
      <div className="relative overflow-hidden">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className={`h-36 w-full transition duration-300 group-hover:scale-105 sm:h-52 ${
            isOutOfStock ? "grayscale contrast-90 opacity-75" : ""
          }`}
        />
        {isOutOfStock ? (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-xs sm:left-3 sm:top-3 sm:px-3 sm:text-xs">
            <span>🚫</span> Tạm hết
          </span>
        ) : product.isFeatured ? (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold text-white shadow-xs sm:left-3 sm:top-3 sm:px-3 sm:text-xs">
            <span>🔥</span> Bán chạy
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted sm:text-xs">
          {product.category}
        </span>
        <h3
          className={`text-sm font-bold sm:text-base ${
            isOutOfStock ? "text-ink/70" : "text-ink"
          }`}
        >
          {product.name}
        </h3>
        <p className="line-clamp-2 text-xs text-muted sm:text-sm">
          {product.description}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 pt-3">
          <span
            className={`text-sm font-bold sm:text-base ${
              isOutOfStock ? "text-muted" : "text-brand"
            }`}
          >
            {vnd(product.price)}
          </span>
          {isOutOfStock ? (
            <span className="text-[11px] font-semibold text-muted sm:text-xs">
              Tạm hết hàng
            </span>
          ) : (
            <span className="hidden text-xs font-bold text-brand group-hover:underline sm:inline">
              Chọn món →
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
