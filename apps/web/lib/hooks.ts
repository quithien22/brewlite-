"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "./api";

/** Gọi API khi mount / khi deps đổi. Giữ lại data cũ trong lúc tải lại. */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{
    data: T | null;
    error: ApiError | null;
    loading: boolean;
  }>({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let off = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((data) => {
        if (!off) setState({ data, error: null, loading: false });
      })
      .catch((e) => {
        if (off) return;
        const error =
          e instanceof ApiError ? e : new ApiError("Đã có lỗi xảy ra", 500);
        setState((s) => ({ data: s.data, error, loading: false }));
      });
    return () => {
      off = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}

/** Chuyển về /login nếu chưa đăng nhập. Trả về true khi đã sẵn sàng. */
export function useRequireAuth() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hydrated && !token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, token, pathname, router]);

  return hydrated && !!token;
}
