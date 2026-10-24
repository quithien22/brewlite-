import type { Metadata } from "next";
import { Suspense } from "react";
import Login from "@/components/auth/Login";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Login dùng useSearchParams (?next=) nên cần Suspense */}
      <Suspense fallback={null}>
        <Login />
      </Suspense>
    </div>
  );
}
