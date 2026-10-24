"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { btnPrimary, input } from "@/components/ui/classes";

export default function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = params.get("next");
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Vui lòng nhập email và mật khẩu");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const s = await api.auth.login({ email: email.trim(), password });
      setSession(s.accessToken, s.user);
      router.replace(target);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full justify-center px-6 py-10">
      <div className="flex w-full max-w-[1280px] flex-col items-start gap-6 md:flex-row">
        <div className="flex w-full flex-col gap-6 md:w-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80"
            alt="Quán cà phê"
            className="h-[300px] w-full rounded-2xl bg-cream object-cover md:h-[500px]"
          />
          <div className="flex flex-col gap-2">
            <h2 className="text-[28px] font-bold text-ink">Chào bạn, một ngày mới!</h2>
            <p className="text-sm text-muted">
              Đăng nhập để lưu món yêu thích, theo dõi đơn hàng và tích điểm cho những lần ghé tiếp theo.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col pt-8 md:w-1/2 md:px-16">
          <h2 className="mb-2 text-[32px] font-bold text-ink">Rất vui gặp lại bạn</h2>
          <p className="mb-8 text-[15px] text-muted">
            Đăng nhập để tiếp tục với ly cà phê yêu thích.
          </p>

          <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
            {error && (
              <div role="alert" className="rounded-lg bg-[#FBE7E7] px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-bold text-ink">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="ban@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={input}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-bold text-ink">Mật khẩu</label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${input} pr-20`}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted hover:text-brand"
                >
                  {show ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#6F4E37]" />
                Ghi nhớ đăng nhập
              </label>
              <Link href="/forgotpassword" className="text-sm font-bold text-brand hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            <button disabled={busy} className={`${btnPrimary} mt-2 w-full py-3.5`}>
              {busy ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            <div className="my-1 flex items-center gap-4">
              <div className="h-px flex-1 bg-line" />
              <span className="text-xs text-muted">hoặc</span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <button
              type="button"
              disabled
              title="Sắp ra mắt"
              className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-lg border border-line bg-white py-3.5 text-sm font-bold text-ink opacity-60"
            >
              Đăng nhập với Google (sắp ra mắt)
            </button>

            <p className="mt-2 text-center text-sm text-muted">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="font-bold text-brand hover:underline">
                Đăng ký ngay
              </Link>
            </p>
            <p className="text-center text-[11px] text-muted">
              Thông tin của bạn được bảo mật và mã hóa.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
