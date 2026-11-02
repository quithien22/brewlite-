// Developed by Loc - Home & Orders module
import Link from "next/link";
import FeaturedProducts from "@/components/product/FeaturedProducts";
import { btnOutline, btnPrimary, container } from "@/components/ui/classes";

const STEPS = [
  { n: "1", title: "Chọn đồ uống", text: "Xem thực đơn, chọn size, topping, mức đường và đá." },
  { n: "2", title: "Thêm vào giỏ", text: "Điều chỉnh số lượng, áp mã giảm giá hoặc dùng điểm thưởng." },
  { n: "3", title: "Thanh toán không tiền mặt", text: "Ví điện tử hoặc thẻ — nhanh, an toàn, không cần mang tiền." },
  { n: "4", title: "Nhận tại quầy", text: "Theo dõi trạng thái đơn và nhận nước ngay khi sẵn sàng." },
];

export default function HomeView() {
  return (
    <>
      <section className="bg-cream/60">
        <div className={`${container} grid items-center gap-8 py-10 md:grid-cols-2 md:gap-10 md:py-20`}>
          <div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand">
              Đặt trước · Nhận nhanh · Không tiền mặt
            </span>
            <h1 className="mt-4 text-[32px] font-bold leading-tight text-ink sm:text-[40px] md:mt-5 md:text-[52px]">
              Một ly ngon, một ngày nhẹ nhàng.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
              BrewLite giúp bạn đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm,
              giảm thời gian xếp hàng và nhận đơn nhanh tại quầy.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap md:mt-8">
              <Link href="/menu" className={`${btnPrimary} px-8 py-4`}>
                Đặt món ngay
              </Link>
              <Link href="/promotions" className={`${btnOutline} px-8 py-4`}>
                Xem khuyến mãi
              </Link>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=1000&q=80"
            alt="Quán cà phê BrewLite"
            className="h-[220px] w-full rounded-2xl bg-cream object-cover sm:h-[300px] md:h-[420px]"
          />
        </div>
      </section>

      <section className={`${container} py-10 md:py-14`}>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between md:mb-8">
          <div>
            <h2 className="text-2xl font-bold text-ink sm:text-[28px]">Món được yêu thích</h2>
            <p className="mt-1 text-sm text-muted">Những ly khách của BrewLite gọi nhiều nhất.</p>
          </div>
          <Link href="/menu" className="text-sm font-bold text-brand hover:underline">
            Xem toàn bộ thực đơn →
          </Link>
        </div>
        <FeaturedProducts />
      </section>

      <section className="bg-white">
        <div className={`${container} py-10 md:py-14`}>
          <h2 className="mb-6 text-center text-2xl font-bold text-ink sm:text-[28px] md:mb-8">
            Đặt đồ uống chỉ trong 4 bước
          </h2>
          <ol className="grid gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-2xl border border-line bg-page p-5 md:p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 font-bold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`${container} py-10 md:py-14`}>
        <div className="flex flex-col items-stretch justify-between gap-5 rounded-2xl bg-ink px-5 py-8 text-cream sm:items-start md:flex-row md:items-center md:gap-6 md:px-8 md:py-10">
          <div>
            <h2 className="text-2xl font-bold">Ly đầu tiên giảm 10% với mã CHAO10</h2>
            <p className="mt-1 text-sm text-cream/80">
              Đăng ký tài khoản để tích điểm mỗi đơn và nhận ưu đãi riêng.
            </p>
          </div>
          <Link
            href="/register"
            className="shrink-0 rounded-lg bg-white px-8 py-4 text-center text-sm font-bold text-brand hover:bg-cream"
          >
            Tạo tài khoản
          </Link>
        </div>
      </section>
    </>
  );
}
