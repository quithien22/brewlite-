"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { btnOutline, btnPrimary, container } from "@/components/ui/classes";
import ProductImage from "@/components/ui/ProductImage";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { api } from "@/lib/api";
import { vnd } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { ProductDetail, SizeCode } from "@/lib/types";
import { MAX_QTY, useCartStore } from "@/store/cart";

// ============================================================================
// 1. SUB-COMPONENTS (GIAO DIỆN PHỤ TRỢ)
// ============================================================================

interface PillProps {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

/**
 * Pill Component: Nút chọn tùy chọn (Kích cỡ, Topping, Đường, Đá)
 * - Sử dụng button type="button" để tránh trigger nhầm form submit.
 * - aria-pressed giúp các công cụ trợ thính (screen readers) nhận biết trạng thái đang chọn.
 */
function Pill({ active, disabled = false, onClick, children }: PillProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-brand bg-brand text-white shadow-sm"
          : "border-line bg-white text-ink hover:border-brand"
      }`}
    >
      {children}
    </button>
  );
}

interface GroupProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Group Component: Bọc các nhóm tùy chọn lựa chọn
 * - Áp dụng thuộc tính role="group" và aria-labelledby nhằm đảm bảo chuẩn tiếp cận Web A11y.
 */
function Group({ title, children }: GroupProps) {
  const groupId = useId();

  return (
    <div role="group" aria-labelledby={groupId}>
      <h3 id={groupId} className="mb-2 text-sm font-bold text-ink">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

// ============================================================================
// 2. PRODUCT FORM COMPONENT (LOGIC TÙY CHỌN & GIỎ HÀNG)
// ============================================================================

interface ProductFormProps {
  product: ProductDetail;
}

function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const addLine = useCartStore((s) => s.addLine);

  const { sizes, toppings, sugarLevels, iceLevels, defaultSugar, defaultIce } =
    product.options;

  // --- KIỂM TRA TRẠNG THÁI TỒN KHO ---
  const isOutOfStock = !product.inStock || product.stock <= 0;

  // --- STATE TÙY CHỌN CỦA SẢN PHẨM ---
  // Fallback an toàn: nếu kích cỡ "S" không tồn tại trong danh mục thì ưu tiên lấy phần tử đầu tiên
  const initialSize =
    sizes.find((s) => s.code === "S")?.code ?? sizes[0]?.code ?? ("S" as SizeCode);

  const [size, setSize] = useState<SizeCode>(initialSize);
  const [sugar, setSugar] = useState(defaultSugar ?? sugarLevels[0] ?? "");
  const [ice, setIce] = useState(defaultIce ?? iceLevels[0] ?? "");
  const [toppingIds, setToppingIds] = useState<number[]>([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  // --- TÍNH TOÁN GIÁ & SỐ LƯỢNG (MEMOIZED) ---
  // Sử dụng Set để kiểm tra topping được chọn nhanh hơn với độ phức tạp O(1)
  const toppingIdSet = useMemo(() => new Set(toppingIds), [toppingIds]);

  // Lọc danh sách topping đã chọn
  const chosen = useMemo(
    () => toppings.filter((t) => toppingIdSet.has(t.id)),
    [toppings, toppingIdSet],
  );

  // Phụ phí theo kích thước đã chọn
  const sizeExtra = useMemo(
    () => sizes.find((s) => s.code === size)?.extra ?? 0,
    [sizes, size],
  );

  // Đơn giá 1 sản phẩm kèm toàn bộ topping và phụ phí size
  const unitPrice = useMemo(() => {
    const toppingTotal = chosen.reduce((sum, t) => sum + t.price, 0);
    return product.price + sizeExtra + toppingTotal;
  }, [product.price, sizeExtra, chosen]);

  // Giới hạn số lượng tối đa có thể mua dựa trên cấu hình hệ thống và lượng tồn kho thực tế
  const maxQty = useMemo(() => {
    if (isOutOfStock) return 0;
    return Math.max(1, Math.min(MAX_QTY, product.stock));
  }, [isOutOfStock, product.stock]);

  // --- HÀM XỬ LÝ SỰ KIỆN ---
  /**
   * Bật/tắt topping được chọn và đặt lại trạng thái thông báo giỏ hàng
   */
  function toggleTopping(id: number) {
    setAdded(false);
    setToppingIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  /**
   * Đưa sản phẩm vào giỏ hàng Zustand
   * Lưu ý bảo mật: Backend vẫn bắt buộc phải tính toán lại giá trị thực tế dựa trên DB khi tạo đơn hàng.
   */
  function add() {
    if (isOutOfStock) return;

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
      {/* Nút điều hướng quay lại danh mục thực đơn */}
      <Link
        href="/menu"
        className="inline-flex items-center text-sm font-semibold text-muted transition hover:text-brand"
      >
        ← Thực đơn
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        {/* Khung hiển thị ảnh sản phẩm */}
        <div className="overflow-hidden rounded-2xl border border-line bg-cream">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="h-[320px] w-full object-cover md:h-[480px]"
          />
        </div>

        {/* Khung cấu hình thông tin và tùy chọn */}
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
              <span className="ml-2 text-sm font-medium text-muted">giá cơ bản</span>
            </p>

            {/* Cảnh báo trạng thái tồn kho */}
            {isOutOfStock ? (
              <p className="mt-2 inline-block rounded-full bg-[#FBE7E7] px-3 py-1 text-xs font-bold text-danger">
                Tạm hết hàng
              </p>
            ) : product.stock <= 5 ? (
              <p className="mt-2 text-xs font-semibold text-[#8A5A00]">
                Chỉ còn {product.stock} phần
              </p>
            ) : null}
          </div>

          {/* Nhóm tùy chọn: Kích cỡ */}
          {sizes.length > 0 && (
            <Group title="Kích cỡ">
              {sizes.map((s) => (
                <Pill
                  key={s.code}
                  active={size === s.code}
                  disabled={isOutOfStock}
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
          )}

          {/* Nhóm tùy chọn: Topping */}
          {toppings.length > 0 && (
            <Group title="Topping">
              {toppings.map((t) => (
                <Pill
                  key={t.id}
                  active={toppingIds.includes(t.id)}
                  disabled={isOutOfStock}
                  onClick={() => toggleTopping(t.id)}
                >
                  {t.name}
                  <span className="ml-1 text-xs opacity-80">+{vnd(t.price)}</span>
                </Pill>
              ))}
            </Group>
          )}

          {/* Nhóm tùy chọn: Mức đường */}
          {sugarLevels.length > 0 && (
            <Group title="Mức đường">
              {sugarLevels.map((l) => (
                <Pill
                  key={l}
                  active={sugar === l}
                  disabled={isOutOfStock}
                  onClick={() => {
                    setSugar(l);
                    setAdded(false);
                  }}
                >
                  {l}
                </Pill>
              ))}
            </Group>
          )}

          {/* Nhóm tùy chọn: Mức đá */}
          {iceLevels.length > 0 && (
            <Group title="Mức đá">
              {iceLevels.map((l) => (
                <Pill
                  key={l}
                  active={ice === l}
                  disabled={isOutOfStock}
                  onClick={() => {
                    setIce(l);
                    setAdded(false);
                  }}
                >
                  {l}
                </Pill>
              ))}
            </Group>
          )}

          {/* Bộ điều khiển số lượng và tổng thành tiền */}
          <div className="flex items-center justify-between border-t border-line pt-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Giảm số lượng"
                disabled={qty <= 1 || isOutOfStock}
                onClick={() => {
                  setQty((q) => Math.max(1, q - 1));
                  setAdded(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-lg font-bold text-ink hover:border-brand disabled:cursor-not-allowed disabled:opacity-40"
              >
                −
              </button>
              <span className="w-8 text-center text-base font-bold text-ink">{qty}</span>
              <button
                type="button"
                aria-label="Tăng số lượng"
                disabled={qty >= maxQty || isOutOfStock}
                onClick={() => {
                  setQty((q) => Math.min(maxQty, q + 1));
                  setAdded(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-lg font-bold text-ink hover:border-brand disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Thành tiền</p>
              <p className="text-2xl font-bold text-brand">{vnd(unitPrice * qty)}</p>
            </div>
          </div>

          {/* Nhóm nút hành động: Thêm vào giỏ & Mua ngay */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={add}
              className={`${btnPrimary} flex-1 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {!isOutOfStock ? "Thêm vào giỏ hàng" : "Hết hàng"}
            </button>
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => {
                add();
                router.push("/cart");
              }}
              className={`${btnOutline} flex-1 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Mua ngay
            </button>
          </div>

          {/* Thông báo phản hồi trạng thái thêm giỏ hàng thành công */}
          {added && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center justify-between rounded-lg bg-[#E6F3EA] px-4 py-3 text-sm text-[#1E7A43]"
            >
              <span>
                Đã thêm vào giỏ hàng.{" "}
                <Link href="/cart" className="font-bold underline hover:opacity-80">
                  Xem giỏ hàng
                </Link>
              </span>
              <button
                type="button"
                aria-label="Đóng thông báo"
                onClick={() => setAdded(false)}
                className="ml-2 font-bold text-[#1E7A43] hover:opacity-70"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. MAIN COMPONENT (XỬ LÝ DỮ LIỆU TỪ API & RENDER TRẠNG THÁI)
// ============================================================================

export default function ProductDetailView({ id }: { id: number }) {
  // Hook gọi API tải thông tin chi tiết sản phẩm theo id
  const { data, error, loading, reload } = useApi(
    () => api.products.get(id),
    [id],
  );

  // Trạng thái đang tải dữ liệu
  if (loading && !data) {
    return <Loading label="Đang tải sản phẩm..." />;
  }

  // Trạng thái gặp lỗi khi nạp dữ liệu từ API
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

  // Đề phòng trường hợp nạp dữ liệu rỗng
  if (!data) return null;

  // Sử dụng key={data.id} để đảm bảo toàn bộ state nội bộ của form được reset sạch sẽ khi id thay đổi
  return <ProductForm key={data.id} product={data} />;
}