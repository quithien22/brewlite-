import Link from 'next/link';
import React from 'react';

export default function Footer() {
  return (
    <div className="w-full bg-[#2B2118] flex justify-center font-sans">
      
      {/* Container giới hạn chiều rộng tối đa 1440px, co lại theo màn hình nhỏ */}
      <footer className="w-full max-w-[1440px] px-6 py-12 md:px-[80px] flex flex-col gap-8">
        
        {/* Phần Logo BrewLite */}
        <div>
          <Link href="/" className="text-[#F5EBDD] text-[28px] font-bold font-['Inter'] tracking-tighter">
            BrewLite
          </Link>
        </div>

        {/* Phần Nội dung chính (chia 3 cột) */}
        <div className="flex flex-col gap-8 md:flex-row md:justify-between items-start text-[#F5EBDD] text-[13px] leading-[190%] font-['Inter'] font-normal border-b border-[#F5EBDD]/20 pb-8">
          
          {/* Cột 1: Thông tin liên hệ */}
          <div className="flex flex-col">
            <h3 className="font-bold text-[16px]">Một ly ngon, một ngày nhẹ nhàng.</h3>
            <p>Mở cửa mỗi ngày · 07:00 – 22:00</p>
            <p>Hotline: 1900 1042 · hello@brewlite.vn</p>
          </div>

          {/* Cột 2: Khám phá */}
          <div className="flex flex-col">
            <h3 className="font-bold text-[16px]">Khám phá BrewLite</h3>
            <Link href="/menu" className="hover:text-white transition-colors">Thực đơn</Link>
            <Link href="/cart" className="hover:text-white transition-colors">Giỏ hàng</Link>
            <Link href="/orders" className="hover:text-white transition-colors">Lịch sử đơn hàng</Link>
          </div>

          {/* Cột 3: Hỗ trợ khách hàng (chưa có trang nên để dạng chữ, không gắn link) */}
          <div className="flex flex-col">
            <h3 className="font-bold text-[16px]">Luôn bên bạn</h3>
            <p>Thanh toán an toàn, không tiền mặt</p>
            <p>Hỗ trợ: 1900 1042</p>
          </div>

        </div>

        {/* Phần Copyright */}
        <div className="text-[#F5EBDD] text-[16px] font-['Inter'] font-normal leading-[190%]">
          © 2026 BrewLite. Cà phê thật ngon, thanh toán thật gọn.
        </div>
        
      </footer>
    </div>
  );
}
