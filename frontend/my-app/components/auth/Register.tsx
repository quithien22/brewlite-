"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnPrimary, input } from "@/components/ui/classes";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const PHONE_RE = /^(0|\+84)\d{9,10}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function strength(pw: string) {
  const checks = [
    pw.length >= 8,
    /[A-Za-z]/.test(pw) && /\d/.test(pw),
    pw.length >= 10,
    /[^A-Za-z0-9]/.test(pw) || (/[a-z]/.test(pw) && /[A-Z]/.test(pw)),
  ];
  return checks.filter(Boolean).length;
}

const STRENGTH_TEXT = [
  "Nhập ít nhất 8 ký tự, có cả chữ và số",
  "Mật khẩu yếu — ít nhất 8 ký tự, có chữ và số",
  "Mật khẩu trung bình",
  "Mật khẩu khá mạnh",
  "Mật khẩu mạnh",
];

export default function Register() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const score = strength(password);
  const barColor = score >= 3 ? "bg-[#27AE60]" : score >= 2 ? "bg-[#E0A21B]" : "bg-danger";

  function validate(): string | null {
    if (name.trim().length < 2) return "Họ tên tối thiểu 2 ký tự";
    if (!EMAIL_RE.test(email.trim())) return "Email không hợp lệ";
    if (phone.trim() && !PHONE_RE.test(phone.trim()))
      return "Số điện thoại không hợp lệ";
    if (password.length < 8) return "Mật khẩu tối thiểu 8 ký tự";
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
      return "Mật khẩu cần có cả chữ và số";
    if (password !== confirm) return "Mật khẩu nhập lại không khớp";
    if (!agree) return "Vui lòng đồng ý với Điều khoản sử dụng";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const s = await api.auth.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
      });
      setSession(s.accessToken, s.user);
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full justify-center px-6 py-10">
      <div className="flex w-full max-w-[1280px] flex-col items-start gap-6 md:flex-row">
        {/* Cột trái: hình ảnh & thông điệp */}
        <div className="flex w-full flex-col gap-6 md:w-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80"
            alt="Bàn cà phê"
            className="h-[300px] w-full rounded-2xl bg-cream object-cover md:h-[400px]"
          />
          <div className="mt-4 flex flex-col gap-3">
            <span className="w-max rounded bg-cream px-3 py-1 text-[13px] font-semibold text-brand">
              Mỗi lần ghé, thêm một niềm vui
            </span>
            <h2 className="text-[28px] font-bold text-ink">Gia nhập nhà BrewLite</h2>
            <p className="text-[15px] leading-relaxed text-muted">
              Tích điểm mỗi đơn, nhận ưu đãi riêng và lưu hương vị bạn yêu. Ly đầu tiên giảm 10% với CHAO10.
            </p>
          </div>
        </div>

        {/* Cột phải: form */}
        <div className="flex w-full flex-col md:w-1/2 md:px-16">
          <h2 className="mb-1 text-[36px] font-bold leading-[150%] text-ink">Tạo tài khoản</h2>
          <p className="mb-8 text-[16px] leading-[150%] text-muted">
            Một phút đăng ký, nhiều ngày cà phê ngon.
          </p>

          <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
            {error && (
              <div role="alert" className="rounded-lg bg-[#FBE7E7] px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-bold text-ink">Họ và tên</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Nhập họ và tên"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={input}
              />
            </div>

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

            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="text-sm font-bold text-ink">Số điện thoại</label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="Nhập số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={input}
              />
              <span className="mt-1 text-[12px] text-muted">
                Dùng để thông báo khi đơn sẵn sàng.
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-bold text-ink">Mật khẩu</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${input} pr-20`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted hover:text-brand"
                >
                  {showPw ? "Ẩn" : "Hiện"}
                </button>
              </div>
              <div className="mt-1 flex gap-2" aria-hidden>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded ${password && i <= score ? barColor : "bg-line"}`}
                  />
                ))}
              </div>
              <span className={`mt-1 text-[12px] ${score >= 3 ? "text-ok" : "text-muted"}`}>
                {password ? STRENGTH_TEXT[score] : STRENGTH_TEXT[0]}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirm" className="text-sm font-bold text-ink">Nhập lại mật khẩu</label>
              <input
                id="confirm"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={input}
              />
              {confirm && confirm !== password && (
                <span className="text-[12px] text-danger">Mật khẩu nhập lại chưa khớp</span>
              )}
            </div>

            <label className="mt-2 flex cursor-pointer items-start gap-2 text-sm leading-relaxed text-ink">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-1 h-4 w-4 cursor-pointer accent-[#6F4E37]"
              />
              Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật.
            </label>

            <button disabled={busy} className={`${btnPrimary} mt-2 w-full py-4`}>
              {busy ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>

            <p className="mt-2 text-center text-sm text-muted">
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-bold text-brand hover:underline">
                Đăng nhập
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
