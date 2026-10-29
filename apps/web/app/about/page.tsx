import type { Metadata } from "next";
import Link from "next/link";
import { btnPrimary, container } from "@/components/ui/classes";
import { STORE } from "@/lib/format";

export const metadata: Metadata = { title: "Về chúng tôi" };

const VALUES = [
  { title: "Cà phê thật ngon", text: "Hạt chọn lọc, pha chế đúng vị — mỗi ly đều được làm ngay khi bạn đặt." },
  { title: "Thanh toán thật gọn", text: "Đặt và trả tiền không dùng tiền mặt chỉ trong vài chạm, không phải xếp hàng." },
  { title: "Gần gũi, nhẹ nhàng", text: "Tích điểm mỗi đơn, ưu đãi riêng cho khách quen và không gian để bạn thong thả." },
];

export default function AboutPage() {
  return (
    <div className={`${container} py-12`}>
      <h1 className="text-[32px] font-bold text-ink">Về BrewLite</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
        BrewLite ra đời với một mong muốn đơn giản: giúp bạn có ly cà phê yêu thích mà không mất
        thời gian chờ đợi. Đặt trước trên điện thoại, thanh toán không tiền mặt, rồi ghé quầy nhận
        nước ngay khi sẵn sàng.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {VALUES.map((v) => (
          <div key={v.title} className="rounded-2xl border border-line bg-white p-6">
            <h2 className="text-lg font-bold text-ink">{v.title}</h2>
            <p className="mt-2 text-sm text-muted">{v.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-cream p-8">
        <h2 className="text-xl font-bold text-ink">{STORE.name}</h2>
        <p className="mt-2 text-sm text-muted">{STORE.address}</p>
        <p className="text-sm text-muted">Mở cửa mỗi ngày · 07:00 – 22:00</p>
        <Link href="/menu" className={`${btnPrimary} mt-6`}>
          Xem thực đơn
        </Link>
      </div>
    </div>
  );
}
