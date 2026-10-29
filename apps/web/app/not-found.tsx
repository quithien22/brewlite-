import Link from "next/link";
import { btnOutline, btnPrimary, container } from "@/components/ui/classes";

export default function NotFound() {
  return (
    <div className={`${container} flex justify-center py-20`}>
      <div className="w-full max-w-[560px] rounded-2xl border border-line bg-white p-10 text-center">
        <p className="text-6xl font-bold text-brand">404</p>
        <h1 className="mt-4 text-2xl font-bold text-ink">Không tìm thấy trang này</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Có thể đường dẫn đã thay đổi hoặc ly cà phê bạn tìm đã hết. Về trang chủ hoặc xem thực
          đơn nhé.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className={btnPrimary}>
            Về trang chủ
          </Link>
          <Link href="/menu" className={btnOutline}>
            Xem thực đơn
          </Link>
        </div>
      </div>
    </div>
  );
}
