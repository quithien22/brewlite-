import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import { vnd } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/menu/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-md"
    >
      <div className="relative overflow-hidden">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="h-52 w-full transition duration-300 group-hover:scale-105"
        />
        {!product.inStock ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-bold text-white">
            Hết hàng
          </span>
        ) : product.isFeatured ? (
          <span className="absolute left-3 top-3 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">
            Bán chạy
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          {product.category}
        </span>
        <h3 className="text-base font-bold text-ink">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-muted">{product.description}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-bold text-brand">{vnd(product.price)}</span>
          <span className="text-xs font-bold text-brand">Chọn món →</span>
        </div>
      </div>
    </Link>
  );
}
