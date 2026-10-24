"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnOutline, btnPrimary, container } from "@/components/ui/classes";
import ProductImage from "@/components/ui/ProductImage";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { api } from "@/lib/api";
import { vnd } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { ProductDetail, SizeCode } from "@/lib/types";
import { MAX_QTY, useCartStore } from "@/store/cart";

function Pill({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-brand bg-brand text-white"
          : "border-line bg-white text-ink hover:border-brand"
      }`}
    >
      {children}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold text-ink">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ProductForm({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const addLine = useCartStore((s) => s.addLine);
  const { sizes, toppings, sugarLevels, iceLevels, defaultSugar, defaultIce } =
    product.options;

  const [size, setSize] = useState<SizeCode>("S");
  const [sugar, setSugar] = useState(defaultSugar);
  const [ice, setIce] = useState(defaultIce);
  const [toppingIds, setToppingIds] = useState<number[]>([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const chosen = toppings.filter((t) => toppingIds.includes(t.id));
  const sizeExtra = sizes.find((s) => s.code === size)?.extra ?? 0;
  const unitPrice =
    product.price + sizeExtra + chosen.reduce((sum, t) => sum + t.price, 0);
  const maxQty = Math.max(1, Math.min(MAX_QTY, product.stock));

  function toggleTopping(id: number) {
    setAdded(false);
    setToppingIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  function add() {
    addLine({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      size,
      sugar,
      ice,
      toppings: chosen,
      unitPrice,
      qty,
    });
    setAdded(true);
  }

  return (
    <div className={`${container} py-10`}>
      <Link href="/menu" className="text-sm font-semibold text-muted hover:text-brand">
        ← Thực đơn
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-line bg-cream">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="h-[320px] w-full md:h-[480px]"
          />
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              {product.category}
            </span>
            <h1 className="mt-1 text-[32px] font-bold leading-tight text-ink">
              {product.name}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              {product.description}
            </p>
            <p className="mt-3 text-2xl font-bold text-brand">
              {vnd(product.price)}
              <span className="ml-2 text-sm font-medium text-muted">giá cỡ S</span>
            </p>
            {!product.inStock ? (
              <p className="mt-2 inline-block rounded-full bg-[#FBE7E7] px-3 py-1 text-xs font-bold text-danger">
                Tạm hết hàng
              </p>
            ) : product.stock <= 5 ? (
              <p className="mt-2 text-xs font-semibold text-[#8A5A00]">
                Chỉ còn {product.stock} phần
              </p>
            ) : null}
          </div>

          <Group title="Kích cỡ">
            {sizes.map((s) => (
              <Pill
                key={s.code}
                active={size === s.code}
                onClick={() => {
                  setSize(s.code);
                  setAdded(false);
                }}
              >
                {s.label}
                {s.extra > 0 && (
                  <span className="ml-1 text-xs opacity-80">+{vnd(s.extra)}</span>
                )}
              </Pill>
            ))}
          </Group>

          {toppings.length > 0 && (
            <Group title="Topping">
              {toppings.map((t) => (
                <Pill
                  key={t.id}
                  active={toppingIds.includes(t.id)}
                  onClick={() => toggleTopping(t.id)}
                >
                  {t.name}
                  <span className="ml-1 text-xs opacity-80">+{vnd(t.price)}</span>
                </Pill>
              ))}
            </Group>
          )}

          <Group title="Mức đường">
            {sugarLevels.map((l) => (
              <Pill
                key={l}
                active={sugar === l}
                onClick={() => {
                  setSugar(l);
                  setAdded(false);
                }}
              >
                {l}
              </Pill>
            ))}
          </Group>

          <Group title="Mức đá">
            {iceLevels.map((l) => (
              <Pill
                key={l}
                active={ice === l}
                onClick={() => {
                  setIce(l);
                  setAdded(false);
                }}
              >
                {l}
              </Pill>
            ))}
          </Group>

          <div className="flex items-center justify-between border-t border-line pt-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Giảm số lượng"
                disabled={qty <= 1}
                onClick={() => {
                  setQty((q) => Math.max(1, q - 1));
                  setAdded(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-lg font-bold text-ink hover:border-brand disabled:opacity-40"
              >
                −
              </button>
              <span className="w-8 text-center text-base font-bold text-ink">{qty}</span>
              <button
                type="button"
                aria-label="Tăng số lượng"
                disabled={qty >= maxQty}
                onClick={() => {
                  setQty((q) => Math.min(maxQty, q + 1));
                  setAdded(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-lg font-bold text-ink hover:border-brand disabled:opacity-40"
              >
                +
              </button>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Thành tiền</p>
              <p className="text-2xl font-bold text-brand">{vnd(unitPrice * qty)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={!product.inStock}
              onClick={add}
              className={`${btnPrimary} flex-1`}
            >
              {product.inStock ? "Thêm vào giỏ hàng" : "Hết hàng"}
            </button>
            <button
              type="button"
              disabled={!product.inStock}
              onClick={() => {
                add();
                router.push("/cart");
              }}
              className={`${btnOutline} flex-1`}
            >
              Mua ngay
            </button>
          </div>

          {added && (
            <p
              role="status"
              className="rounded-lg bg-[#E6F3EA] px-4 py-3 text-sm text-[#1E7A43]"
            >
              Đã thêm vào giỏ hàng.{" "}
              <Link href="/cart" className="font-bold underline">
                Xem giỏ hàng
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailView({ id }: { id: number }) {
  const { data, error, loading, reload } = useApi(
    () => api.products.get(id),
    [id],
  );

  if (loading && !data) return <Loading label="Đang tải sản phẩm..." />;

  if (error && !data) {
    return (
      <div className={`${container} py-10`}>
        {error.status === 404 ? (
          <EmptyState
            title="Không tìm thấy sản phẩm"
            description="Sản phẩm này không còn trong thực đơn hoặc đường dẫn chưa đúng."
            href="/menu"
            action="Về thực đơn"
          />
        ) : (
          <ErrorState error={error} onRetry={reload} />
        )}
      </div>
    );
  }

  if (!data) return null;
  return <ProductForm key={data.id} product={data} />;
}
