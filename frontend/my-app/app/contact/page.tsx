import type { Metadata } from "next";
import { container } from "@/components/ui/classes";
import { STORE } from "@/lib/format";

export const metadata: Metadata = { title: "Liên hệ" };

const ITEMS = [
  { label: "Địa chỉ", value: STORE.address },
  { label: "Hotline", value: STORE.phone },
  { label: "Email", value: "hello@brewlite.vn" },
  { label: "Giờ mở cửa", value: "Mỗi ngày · 07:00 – 22:00" },
];

export default function ContactPage() {
  return (
    <div className={`${container} py-12`}>
      <h1 className="text-[32px] font-bold text-ink">Liên hệ</h1>
      <p className="mt-3 max-w-2xl text-base text-muted">
        Cần hỗ trợ về đơn hàng hay có góp ý cho BrewLite? Hãy liên hệ chúng mình theo thông tin dưới đây.
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        {ITEMS.map((i) => (
          <div key={i.label} className="rounded-2xl border border-line bg-white p-6">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              {i.label}
            </dt>
            <dd className="mt-1 text-base font-bold text-ink">{i.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
