"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { initials } from "@/lib/format";
import { useAuthStore } from "@/store/auth";
import { cartCount, useCartStore } from "@/store/cart";

const NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/menu", label: "Thực đơn" },
  { href: "/promotions", label: "Khuyến mãi" },
  { href: "/about", label: "Về chúng tôi" },
  { href: "/contact", label: "Liên hệ" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const logout = useAuthStore((s) => s.logout);
  const count = useCartStore((s) => cartCount(s.lines));
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/"
          className="text-3xl font-bold tracking-tight text-brand"
        >
          BrewLite
        </Link>

        <nav className="hidden gap-8 text-sm font-semibold text-ink md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`transition-colors hover:text-brand ${
                isActive(n.href) ? "text-brand" : ""
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/menu"
            aria-label="Tìm đồ uống"
            className="text-muted hover:text-brand"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </Link>

          <Link
            href="/cart"
            aria-label="Giỏ hàng"
            className="relative text-muted hover:text-brand"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            {count > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          {hydrated && token && user ? (
            <div className="relative">
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 text-sm font-semibold text-ink"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-xs font-bold text-brand">
                  {initials(user.name)}
                </span>
                <span className="hidden sm:inline">{user.name}</span>
                <span className="text-muted">▾</span>
              </button>
              {open && (
                <>
                  <button
                    aria-label="Đóng menu"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-line bg-white p-2 text-sm shadow-lg">
                    <p className="px-3 py-2 text-xs text-muted">
                      {user.loyaltyPoints} điểm thưởng
                    </p>
                    <Link
                      href="/orders"
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2 hover:bg-cream"
                    >
                      Lịch sử đơn hàng
                    </Link>
                    <button
                      onClick={() => {
                        setOpen(false);
                        logout();
                        router.push("/");
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-danger hover:bg-cream"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : hydrated ? (
            <div className="flex items-center gap-5">
              <Link
                href="/login"
                className="text-sm font-semibold text-muted hover:text-brand"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
              >
                Đăng ký
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
