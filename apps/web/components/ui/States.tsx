import Link from "next/link";
import type { ApiError } from "@/lib/api";
import { btnOutline, btnPrimary } from "./classes";

export function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-white px-6 py-14 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-cream text-brand">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9z" />
          <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
          <path d="M8 3v2M11 3v2M14 3v2" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      {href && action && (
        <Link href={href} className={`${btnPrimary} mt-6`}>
          {action}
        </Link>
      )}
    </div>
  );
}

/** Lỗi gọi API: phân biệt mất kết nối và lỗi máy chủ (theo thiết kế 404 & lỗi). */
export function ErrorState({
  error,
  onRetry,
}: {
  error: ApiError;
  onRetry?: () => void;
}) {
  const offline = error.isNetwork;
  return (
    <div className="rounded-2xl border border-line bg-white p-8 text-center">
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
          offline ? "bg-[#FFF3D6] text-[#8A5A00]" : "bg-[#FBE7E7] text-danger"
        }`}
      >
        {offline ? "Không có kết nối" : "Có lỗi xảy ra"}
      </span>
      <h2 className="mt-4 text-2xl font-bold text-ink">
        {offline ? "Đường truyền đang nghỉ một chút" : "Chúng mình gặp một chút trục trặc"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        {offline
          ? "Kiểm tra Wi-Fi hoặc dữ liệu di động rồi thử lại. Giỏ hàng của bạn vẫn được lưu."
          : error.message}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        {onRetry && (
          <button onClick={onRetry} className={btnPrimary}>
            {offline ? "Thử kết nối lại" : "Thử lại"}
          </button>
        )}
        <Link href="/" className={btnOutline}>
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

export function Loading({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-24 text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
