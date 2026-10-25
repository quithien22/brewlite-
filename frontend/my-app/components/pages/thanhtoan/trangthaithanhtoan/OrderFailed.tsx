import React from "react";
import Link from "next/link";

export default function OrderFailedPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between font-sans">
      
      {/* ================= PHẦN NỘI DUNG CHÍNH (MAIN CONTENT) ================= */}
      <main className="w-full flex justify-center py-10">
        <div className="w-[1440px] px-10 flex flex-col gap-6">
          
          {/* Banner Thông báo Lỗi thanh toán / Chưa thể hoàn tất thanh toán */}
          <div className="bg-[#FAF8F5] border border-[#EFECE6] rounded-2xl p-10 flex flex-col items-center text-center gap-3">
            {/* Icon thẻ ngân hàng bị lỗi / dấu X */}
            <div className="relative w-24 h-24 bg-[#FCE8E6] rounded-full flex items-center justify-center text-[#D9534F] mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              {/* Badge dấu X nhỏ góc dưới icon */}
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#D9534F] shadow-sm border border-[#FCE8E6]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>

            <span className="text-xs font-semibold text-[#D9534F] tracking-wider uppercase bg-[#FCE8E6] px-3 py-1 rounded-full">
              Thanh toán thất bại
            </span>
            <h1 className="text-3xl font-bold text-[#2B2118]">
              Chưa thể hoàn tất thanh toán
            </h1>
            <p className="text-[#6B5E53] text-sm max-w-lg">
              Giao dịch chưa được xác nhận hoặc đã hết thời gian chờ. Đừng lo, giỏ hàng của bạn vẫn được giữ lại.
            </p>
          </div>

          {/* Grid 2 cột: Thông tin giao dịch & Tóm tắt đơn hàng */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* Cột trái (8 phần): Thông tin giao dịch & Các nút Thử lại / Đổi phương thức */}
            <div className="col-span-8 flex flex-col gap-6">
              
              {/* Box Thông tin giao dịch */}
              <div className="bg-white border border-[#EFECE6] rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
                <h3 className="font-bold text-lg text-[#2B2118]">
                  Thông tin giao dịch
                </h3>

                <p className="text-sm text-[#6B5E53]">
                  Mã đơn dự kiến: <span className="font-bold text-[#2B2118]">#1042</span> &nbsp;·&nbsp; Phương thức: <span className="font-bold text-[#2B2118]">MoMo</span> &nbsp;·&nbsp; Thời gian: <span className="font-medium text-[#6B5E53]">09/10/2026 · 09:30</span> &nbsp;·&nbsp; Số tiền: <span className="font-bold text-[#2B2118]">144.900đ</span>
                </p>

                {/* Cảnh báo lỗi */}
                <div className="bg-[#FCE8E6] border border-[#F5C6CB] text-[#721C24] p-3.5 rounded-xl text-xs flex items-center gap-2.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#D9534F] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Đơn chưa được thanh toán, cửa hàng chưa bắt đầu pha chế.</span>
                </div>

                <p className="text-xs text-[#8C7A6B]">
                  Nếu tài khoản đã bị trừ tiền, vui lòng không thanh toán lại. Liên hệ <span className="font-semibold text-[#2B2118]">1900 1042</span> để chúng mình kiểm tra và hỗ trợ.
                </p>

                {/* Các nút bấm thao tác giao dịch */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Link href="/thanh-toan" className="bg-[#6F4E37] text-white py-3 px-6 rounded-xl font-semibold hover:bg-opacity-90 transition-all shadow-sm flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Thử lại
                  </Link>
                  <Link href="/thanh-toan" className="bg-white border border-[#E0D6CC] text-[#2B2118] py-3 px-6 rounded-xl font-semibold hover:bg-[#FAF8F5] transition-all flex items-center justify-center">
                    Đổi phương thức
                  </Link>
                </div>

                <div className="text-center mt-1">
                  <Link href="/gio-hang" className="text-xs font-semibold text-[#6F4E37] hover:underline">
                    Quay lại giỏ hàng
                  </Link>
                </div>
              </div>

            </div>

            {/* Cột phải (4 phần): Tóm tắt đơn hàng */}
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

            </div>

          </div>
        </div>
      </main>

       
    </div>
  );
}