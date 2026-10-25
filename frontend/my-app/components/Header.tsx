'use client';

import Link from 'next/link';
import React from 'react';
import { useCart } from './pages/context/CartContext';

export default function Header() {
  const { totalCartCount } = useCart();

  return (
    <div className="w-full bg-[#F5EBDD] flex justify-center font-sans">
      
      {/* Container giới hạn chiều rộng 1440px */}
      <header className="w-[1440px] px-10 py-5 flex items-center justify-between">
        
        {/* Phần 1: Logo */}
        <Link href="/" className="text-[#6F4E37] text-3xl font-bold font-serif tracking-wider">
          BrewLite
        </Link>

        {/* Phần 2: Menu điều hướng */}
        <nav className="flex gap-8 text-[#2B2118] font-semibold text-sm">
          <Link href="/" className="hover:text-[#6F4E37] transition-colors">Trang chủ</Link>
          <Link href="/thuc-don" className="hover:text-[#6F4E37] transition-colors">Thực đơn</Link>
          <Link href="/chi-tiet-don-hang" className="hover:text-[#6F4E37] transition-colors">Đơn hàng</Link>
        </nav>

        {/* Phần 3: Công cụ & Tài khoản */}
        <div className="flex items-center gap-8">
          
          {/* Các Icon */}
          <div className="flex items-center gap-5 text-[#74665B]">
            {/* Icon Tìm kiếm */}
            <button className="hover:text-[#6F4E37] transition-colors" title="Tìm kiếm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            {/* Icon Giỏ hàng - KẾT NỐI VỚI /gio-hang VÀ HIỂN THỊ SỐ LƯỢNG THỰC TẾ */}
            <Link href="/gio-hang" className="hover:text-[#6F4E37] transition-colors relative" title="Giỏ hàng">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {/* Badge số lượng thực tế trong giỏ */}
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#6F4E37] text-[#FFFFFF] text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-in zoom-in-50">
                  {totalCartCount > 99 ? '99+' : totalCartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Nút Đăng nhập / Đăng ký */}
          <div className="flex items-center gap-5">
            <Link href="/login" className="text-[#74665B] text-sm font-semibold hover:text-[#6F4E37] transition-colors">
              Đăng nhập
            </Link>
            <Link href="/register" className="bg-[#6F4E37] text-[#FFFFFF] text-sm px-6 py-2.5 rounded-lg font-semibold hover:bg-opacity-90 transition-all shadow-sm">
              Đăng ký
            </Link>
          </div>
          
        </div>
      </header>
    </div>
  );
}