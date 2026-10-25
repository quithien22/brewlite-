import React from "react";
import Link from "next/link";

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between font-sans">
      
      {/* ================= PHẦN NỘI DUNG CHÍNH (MAIN CONTENT) ================= */}
      <main className="w-full flex justify-center py-10">
        <div className="w-[1440px] px-10 flex flex-col gap-6">
          {/* Banner Thông báo thành công */}
          <div className="bg-[#EAF5ED] border border-[#CDEAD2] rounded-2xl p-10 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-[#2E7D32]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="text-xs font-semibold text-[#2E7D32] tracking-wider uppercase">
              Đã thanh toán
            </span>
            <h1 className="text-3xl font-bold text-[#2B2118]">
              Đặt hàng thành công!
            </h1>
            <p className="text-[#6B5E53] text-sm">
              Cảm ơn Minh Anh. Chúng mình đã nhận đơn và sẽ chuẩn bị thật ngon.
            </p>
            <div className="mt-2">
              <h2 className="text-xl font-bold text-[#2B2118]">
                Đơn hàng #1042
              </h2>
              <p className="text-xs text-[#8C7A6B] mt-1">
                09/10/2026 · 09:30 · Thanh toán qua MoMo
              </p>
            </div>
          </div>

          {/* Grid 2 cột: Món ăn & Tóm tắt đơn hàng */}
          <div className="grid grid-cols-12 gap-6">
            {/* Cột trái (8 phần): Món ngon & Hẹn gặp */}
            <div className="col-span-8 flex flex-col gap-6">
              {/* Danh sách món */}
              <div className="bg-white border border-[#EFECE6] rounded-2xl p-6 flex flex-col gap-6 shadow-sm">
                <h3 className="font-bold text-lg text-[#2B2118]">
                  Món ngon của bạn
                </h3>

                {/* Món 1 */}
                <div className="flex items-start justify-between pb-6 border-b border-[#F5F2EC]">
                  <div className="flex gap-4">
                    <img
                      src="/images/menu/ca-phe-sua-da.jpg"
                      alt="Cà phê sữa đá"
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-[#2B2118]">
                        Cà phê sữa đá
                      </h4>
                      <p className="text-xs text-[#8C7A6B] mt-0.5">
                        Cỡ M · Kem cheese · 50% đường · Ít đá
                      </p>
                      <p className="text-xs font-medium text-[#6B5E53] mt-2">
                        58.000đ × 2 = 118.000đ
                      </p>
                    </div>
                  </div>
                </div>

                {/* Món 2 */}
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <img
                      src="/images/menu/tra-dao-cam-sa.jpg"
                      alt="Trà đào cam sả"
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-[#2B2118]">
                        Trà đào cam sả
                      </h4>
                      <p className="text-xs text-[#8C7A6B] mt-0.5">
                        Cỡ S · 100% đường · Đá bình thường
                      </p>
                      <p className="text-xs font-medium text-[#6B5E53] mt-2">
                        45.000đ × 1 = 45.000đ
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FAF8F5] p-3 rounded-lg text-xs text-[#6B5E53]">
                  Ghi chú: Pha đậm hơn một chút giúp mình nhé.
                </div>
              </div>

              {/* Thông tin hẹn gặp */}
              <div className="bg-white border border-[#EFECE6] rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
                <h3 className="font-bold text-sm text-[#8C7A6B]">
                  Hẹn gặp bạn lúc 09:45
                </h3>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-[#F5EBDD] text-[#6F4E37] rounded-xl">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2B2118]">
                      BrewLite Nguyễn Huệ
                    </h4>
                    <p className="text-xs text-[#8C7A6B]">
                      28 Nguyễn Huệ, Bến Nghé, TP. Hồ Chí Minh
                    </p>
                    <p className="text-xs font-medium text-[#A66E38] mt-1">
                      Dự kiến nhận sau 15 phút. Đọc mã #1042 tại quầy.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải (4 phần): Tóm tắt đơn hàng & Nút thao tác */}
            <div className="col-span-4 flex flex-col gap-6">
              {/* Box Tóm tắt đơn hàng */}
              <div className="bg-white border border-[#EFECE6] rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
                <h3 className="font-bold text-lg text-[#2B2118] border-b border-[#F5F2EC] pb-3">
                  Tóm tắt đơn hàng
                </h3>

                <div className="flex justify-between text-sm text-[#6B5E53]">
                  <span>Tạm tính · 3 sản phẩm</span>
                  <span className="font-medium text-[#2B2118]">161.000đ</span>
                </div>
                <div className="flex justify-between text-sm text-[#6B5E53]">
                  <span>Ưu đãi CHAO10 · 10%</span>
                  <span className="font-medium text-[#D9534F]">-16.100đ</span>
                </div>
                <div className="flex justify-between text-sm text-[#6B5E53]">
                  <span>Điểm thưởng sử dụng</span>
                  <span className="font-medium text-[#2B2118]">0đ</span>
                </div>

                <div className="border-t border-[#F5F2EC] pt-4 flex justify-between items-center">
                  <span className="font-bold text-[#2B2118]">Tổng cộng</span>
                  <span className="font-bold text-xl text-[#2B2118]">
                    144.900đ
                  </span>
                </div>

                <p className="text-[11px] text-[#8C7A6B] leading-relaxed">
                  Đã bao gồm thuế. Nhận tại cửa hàng, không có phí giao hàng.
                  <br />
                  Thanh toán an toàn · Không dùng tiền mặt
                </p>
              </div>

              {/* Thông báo điểm thưởng */}
              <div className="bg-[#EAF5ED] border border-[#CDEAD2] rounded-xl p-4 flex items-center gap-3">
                <div className="text-[#2E7D32]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium text-[#2E7D32]">
                  Bạn sẽ nhận 14 điểm khi đơn hoàn thành.
                </span>
              </div>

              {/* Các nút bấm hành động */}
              <div className="flex flex-col gap-3">
                <Link href="/chi-tiet-don-hang" className="w-full block text-center bg-[#6F4E37] text-white py-3 rounded-xl font-semibold hover:bg-opacity-90 transition-all shadow-sm">
                  Theo dõi đơn
                </Link>
                <Link href="/" className="w-full block text-center bg-white border border-[#E0D6CC] text-[#2B2118] py-3 rounded-xl font-semibold hover:bg-[#FAF8F5] transition-all">
                  Về trang chủ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      
     
    </div>
  );
}
