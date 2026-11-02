"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { initials } from "@/lib/format";
import { useAuthStore } from "@/store/auth";
import { cartCount, useCartStore } from "@/store/cart";

const NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/menu", label: "Thực đơn" },
  { href: "/orders", label: "Đơn hàng" },
];

/**
 * Khu vực tài khoản.
 * - variant "dropdown": dùng trên desktop (>= md), menu thả xuống.
 * - variant "drawer": dùng trong menu mobile, hiển thị trải dài, nút lớn dễ bấm.
 */
function AccountArea({ variant }: { variant: "dropdown" | "drawer" }) {
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

  // Đóng menu khi bấm ra ngoài hoặc nhấn Esc (chỉ cần cho dropdown)
  useEffect(() => {
    if (!open || variant !== "dropdown") return;
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
  }, [open, variant]);

  // Chưa nạp xong phiên từ localStorage: giữ chỗ để không nháy nút Đăng nhập
  if (!hydrated) {
    return variant === "dropdown" ? <div className="h-10 w-48" aria-hidden /> : null;
  }

  // ---------- Menu mobile (drawer) ----------
  if (variant === "drawer") {
    if (!token || !user) {
      return (
        <div className="flex gap-3">
          <Link
            href="/login"
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-[#6F4E37] text-sm font-semibold text-[#6F4E37]"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-[#6F4E37] text-sm font-semibold text-white"
          >
            Đăng ký
          </Link>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 px-1 pb-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6F4E37] text-xs font-bold text-white">
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#2B2118]">{user.name}</p>
            <p className="truncate text-xs text-[#74665B]">{user.email}</p>
          </div>
        </div>
        <p className="px-1 pb-2 text-xs text-[#74665B]">
          Điểm thưởng:{" "}
          <span className="font-bold text-[#6F4E37]">
            {user.loyaltyPoints.toLocaleString("vi-VN")} điểm
          </span>
        </p>
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace("/");
          }}
          className="flex min-h-[44px] w-full items-center rounded-lg px-3 text-left text-sm font-semibold text-[#B3261E] hover:bg-[#FBE7E7]"
        >
          Đăng xuất
        </button>
      </div>
    );
  }

  // ---------- Desktop (dropdown) ----------
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
  const pathname = usePathname();
  const totalCartCount = useCartStore((state) => cartCount(state.lines));
  const [menuOpen, setMenuOpen] = useState(false);

  // Đóng menu mobile khi chuyển trang
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Esc đóng menu mobile
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="sticky top-0 z-40 w-full bg-[#F5EBDD] flex justify-center font-sans">
      {/* Container giới hạn chiều rộng 1440px */}
      <header className="relative w-full max-w-[1440px]">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:h-[73px] lg:px-10">
          {/* Logo */}
          <Link
            href="/"
            className="text-[#6F4E37] text-2xl font-bold font-serif tracking-wider sm:text-3xl"
          >
            BrewLite
          </Link>

          {/* Menu điều hướng: chỉ hiện từ md trở lên */}
          <nav className="hidden gap-6 text-[#2B2118] font-semibold text-sm md:flex lg:gap-8">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`transition-colors hover:text-[#6F4E37] ${
                  isActive(n.href) ? "text-[#6F4E37]" : ""
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Công cụ: giỏ hàng, tài khoản (desktop), hamburger (mobile) */}
          <div className="flex items-center gap-1 md:gap-6 lg:gap-8">
            <Link
              href="/cart"
              className="relative flex h-11 w-11 items-center justify-center text-[#74665B] transition-colors hover:text-[#6F4E37]"
              title="Giỏ hàng"
              aria-label={`Giỏ hàng${totalCartCount > 0 ? `, ${totalCartCount} sản phẩm` : ""}`}
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
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#6F4E37] px-1 text-[10px] font-bold text-[#FFFFFF]">
                  {totalCartCount > 99 ? "99+" : totalCartCount}
                </span>
              )}
            </Link>

            <div className="hidden md:block">
              <AccountArea variant="dropdown" />
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[#2B2118] hover:bg-[#EADCC8] md:hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              >
                {menuOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Menu mobile: xổ xuống dưới header */}
        {menuOpen && (
          <div
            id="mobile-menu"
            className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-[#E5D9CD] bg-[#F5EBDD] px-4 pb-5 pt-2 shadow-lg md:hidden"
          >
            <nav className="flex flex-col text-[#2B2118] font-semibold text-base">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex min-h-[48px] items-center border-b border-[#E5D9CD]/70 ${
                    isActive(n.href) ? "text-[#6F4E37]" : ""
                  }`}
                >
                  {n.label}
                </Link>
              ))}
              <Link
                href="/promotions"
                className="flex min-h-[48px] items-center border-b border-[#E5D9CD]/70"
              >
                Khuyến mãi
              </Link>
            </nav>
            <div className="mt-4">
              <AccountArea variant="drawer" />
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
