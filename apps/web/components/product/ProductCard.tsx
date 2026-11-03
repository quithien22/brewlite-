import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import { vnd } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/menu/detail?id=${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-md"
    >
      <div className="relative overflow-hidden">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="h-36 w-full transition duration-300 group-hover:scale-105 sm:h-52"
        />
        {!product.inStock ? (
          <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-bold text-white sm:left-3 sm:top-3 sm:px-3 sm:text-xs">
            Hết hàng
          </span>
        ) : product.isFeatured ? (
          <span className="absolute left-2 top-2 rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold text-white sm:left-3 sm:top-3 sm:px-3 sm:text-xs">
            Bán chạy
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted sm:text-xs">
          {product.category}
        </span>
        <h3 className="text-sm font-bold text-ink sm:text-base">{product.name}</h3>
        <p className="line-clamp-2 text-xs text-muted sm:text-sm">{product.description}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 pt-3">
          <span className="text-sm font-bold text-brand sm:text-base">{vnd(product.price)}</span>
          <span className="hidden text-xs font-bold text-brand sm:inline">Chọn món →</span>
        </div>
      </div>
    </Link>
  );
}
