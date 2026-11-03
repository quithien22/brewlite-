"use client";

import { notFound, useSearchParams } from "next/navigation";
import { Suspense, type ComponentType } from "react";
import { Loading } from "./States";

type View = ComponentType<{ id: number }>;

function Resolved({ View }: { View: View }) {
  const raw = useSearchParams().get("id");
  const n = Number(raw);
  if (!raw || !Number.isInteger(n) || n < 1) notFound();
  return <View id={n} />;
}

/**
 * Đọc `?id=` từ URL (vd. /menu/detail?id=5, /orders/detail?id=12) rồi render view.
 * Dùng query string thay cho route động [id] để xuất được web tĩnh lên GitHub Pages:
 * id là dữ liệu từ backend nên không thể biết trước lúc build.
 * useSearchParams cần nằm trong <Suspense>.
 */
export default function IdRoute({ view }: { view: View }) {
  return (
    <Suspense fallback={<Loading />}>
      <Resolved View={view} />
    </Suspense>
  );
}
