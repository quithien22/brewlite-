import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-6 py-12">
        <Link href="/" className="text-[28px] font-bold tracking-tight">
          BrewLite
        </Link>

        <div className="grid gap-8 border-b border-cream/20 pb-8 text-[13px] leading-[190%] md:grid-cols-3">
          <div>
            <h3 className="text-base font-bold">Một ly ngon, một ngày nhẹ nhàng.</h3>
            <p>Mở cửa mỗi ngày · 07:00 – 22:00</p>
            <p>Hotline: 1900 1042 · hello@brewlite.vn</p>
          </div>

          <div>
            <h3 className="text-base font-bold">Khám phá BrewLite</h3>
            <p>
              <Link href="/menu" className="hover:text-white">Thực đơn</Link>
              {" · "}
              <Link href="/promotions" className="hover:text-white">Khuyến mãi</Link>
              {" · "}
              <Link href="/about" className="hover:text-white">Về chúng tôi</Link>
            </p>
            <p>
              <Link href="/contact" className="hover:text-white">Liên hệ</Link>
              {" · "}
              <Link href="/orders" className="hover:text-white">Lịch sử đơn hàng</Link>
            </p>
            <p>Facebook · Instagram · YouTube</p>
          </div>

          <div>
            <h3 className="text-base font-bold">Luôn bên bạn</h3>
            <p>Hướng dẫn đặt hàng · Câu hỏi thường gặp</p>
            <p>Điều khoản sử dụng · Chính sách bảo mật</p>
            <p>Thanh toán an toàn, không tiền mặt</p>
          </div>
        </div>

        <p className="text-sm">
          © 2026 BrewLite. Cà phê thật ngon, thanh toán thật gọn.
        </p>
      </div>
    </footer>
  );
}
