"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";

/** Nạp giỏ hàng + phiên đăng nhập từ localStorage sau khi mount. */
export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useCartStore.persist.rehydrate();
    Promise.resolve(useAuthStore.persist.rehydrate()).then(() => {
      // Làm mới thông tin user (điểm thưởng) / phát hiện token hết hạn
      if (useAuthStore.getState().token) {
        api.auth
          .me()
          .then((u) => useAuthStore.getState().setUser(u))
          .catch(() => {});
      }
    });
  }, []);

  return <>{children}</>;
}
