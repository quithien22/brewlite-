"use client";

import Link from "next/link";
import { btnOutline, btnPrimary, container } from "@/components/ui/classes";

/** Lỗi bất ngờ khi render một trang (lỗi gọi API đã có ErrorState riêng). */
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className={`${container} flex justify-center py-20`}>
      <div className="w-full max-w-[560px] rounded-2xl border border-line bg-white p-10 text-center">
        <span className="inline-block rounded-full bg-[#FBE7E7] px-3 py-1 text-xs font-bold text-danger">
          Có lỗi xảy ra
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink">Chúng mình gặp một chút trục trặc</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Trang chưa tải được. Giỏ hàng của bạn vẫn được lưu — thử tải lại nhé.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={reset} className={btnPrimary}>
            Thử lại
          </button>
          <Link href="/" className={btnOutline}>
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
