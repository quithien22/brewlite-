"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { initials } from "@/lib/format";
import { useAuthStore } from "@/store/auth";
import { cartCount, useCartStore } from "@/store/cart";

/** Khu vực tài khoản: nút Đăng nhập/Đăng ký khi chưa đăng nhập, menu người dùng khi đã đăng nhập. */
function AccountArea() {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const logout = useAuthStore((s) => s.logout);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Đóng menu khi chuyển trang
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Đóng menu khi bấm ra ngoài hoặc nhấn Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Chưa nạp xong phiên từ localStorage: giữ chỗ để không nháy nút Đăng nhập
  if (!hydrated) return <div className="h-10 w-48" aria-hidden />;

  if (!token || !user) {
    return (
      <div className="flex items-center gap-5">
        <Link
          href="/login"
          className="text-[#74665B] text-sm font-semibold hover:text-[#6F4E37] transition-colors"
        >
          Đăng nhập
        </Link>
        <Link
          href="/register"
          className="bg-[#6F4E37] text-[#FFFFFF] text-sm px-6 py-2.5 rounded-lg font-semibold hover:bg-opacity-90 transition-all shadow-sm"
        >
          Đăng ký
        </Link>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-[#EADCC8] transition-colors"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6F4E37] text-xs font-bold text-white">
          {initials(user.name)}
        </span>
        <span className="max-w-[140px] truncate text-sm font-semibold text-[#2B2118]">
          {user.name}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-[#74665B] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[#E5D9CD] bg-white p-2 shadow-lg"
        >
          <div className="border-b border-[#E5D9CD] px-3 py-2">
            <p className="truncate text-sm font-bold text-[#2B2118]">{user.name}</p>
            <p className="truncate text-xs text-[#74665B]">{user.email}</p>
            <p className="mt-2 text-xs text-[#74665B]">
              Điểm thưởng:{" "}
              <span className="font-bold text-[#6F4E37]">
                {user.loyaltyPoints.toLocaleString("vi-VN")} điểm
              </span>
            </p>
          </div>
          <Link
            href="/orders"
            role="menuitem"
            className="mt-1 block rounded-lg px-3 py-2 text-sm font-semibold text-[#2B2118] hover:bg-[#F5EBDD] transition-colors"
          >
            Đơn hàng của tôi
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
              router.replace("/");
            }}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#B3261E] hover:bg-[#FBE7E7] transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const totalCartCount = useCartStore((state) => cartCount(state.lines));

  return (
    <div className="w-full bg-[#F5EBDD] flex justify-center font-sans">
      {/* Container giới hạn chiều rộng 1440px */}
      <header className="w-full max-w-[1440px] px-10 py-5 flex items-center justify-between">
        {/* Phần 1: Logo */}
        <Link
          href="/"
          className="text-[#6F4E37] text-3xl font-bold font-serif tracking-wider"
        >
          BrewLite
        </Link>

        {/* Phần 2: Menu điều hướng */}
        <nav className="flex gap-8 text-[#2B2118] font-semibold text-sm">
          <Link href="/" className="hover:text-[#6F4E37] transition-colors">
            Trang chủ
          </Link>
          <Link href="/menu" className="hover:text-[#6F4E37] transition-colors">
            Thực đơn
          </Link>
          <Link
            href="/orders"
            className="hover:text-[#6F4E37] transition-colors"
          >
            Đơn hàng
          </Link>
        </nav>

        {/* Phần 3: Công cụ & Tài khoản */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-5 text-[#74665B]">
             

            {/* Icon Giỏ hàng + số lượng thực tế */}
            <Link
              href="/cart"
              className="hover:text-[#6F4E37] transition-colors relative"
              title="Giỏ hàng"
            >
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
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#6F4E37] text-[#FFFFFF] text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {totalCartCount > 99 ? "99+" : totalCartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Tài khoản: Đăng nhập / Đăng ký hoặc thông tin người dùng */}
          <AccountArea />
        </div>
      </header>
    </div>
  );
}
