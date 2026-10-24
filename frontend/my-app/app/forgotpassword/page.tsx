import type { Metadata } from "next";
import ForgotPassword from "@/components/auth/ForgotPassoword";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-white">
      <ForgotPassword />
    </div>
  );
}
