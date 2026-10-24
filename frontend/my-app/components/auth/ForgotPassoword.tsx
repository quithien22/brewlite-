"use client";

import Link from "next/link";
import { useState } from "react";
import { btnPrimary, input } from "@/components/ui/classes";
import { api, ApiError } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Email không hợp lệ");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await api.auth.forgotPassword(email.trim().toLowerCase());
      setSent(r.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full justify-center px-6 py-20">
      <div className="flex w-full max-w-[480px] flex-col rounded-2xl bg-white p-8">
        <div className="mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6F4E37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
        </div>

        <h2 className="mb-2 text-[32px] font-bold text-ink">Quên mật khẩu?</h2>
        <p className="mb-2 text-[16px] leading-[150%] text-muted">
          Đừng lo, chúng mình sẽ giúp bạn quay lại.
        </p>
        <p className="mb-8 text-[16px] leading-[150%] text-muted">
          Nhập email đã đăng ký. Bạn sẽ nhận được liên kết để tạo mật khẩu mới.
        </p>

        {sent ? (
          <div className="flex flex-col gap-6">
            <div role="status" className="rounded-lg bg-[#E6F3EA] px-4 py-3 text-sm text-[#1E7A43]">
              {sent}
            </div>
            <Link href="/login" className={`${btnPrimary} w-full py-4`}>
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
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
                placeholder="Nhập email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={input}
              />
            </div>

            <button disabled={busy} className={`${btnPrimary} mt-2 w-full py-4`}>
              {busy ? "Đang gửi..." : "Gửi liên kết đặt lại"}
            </button>

            <div className="mt-2 w-full text-center">
              <Link href="/login" className="text-sm font-bold text-ink transition-colors hover:text-brand">
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
