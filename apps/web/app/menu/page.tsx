import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/ui/States";
import MenuView from "@/components/views/MenuView";

export const metadata: Metadata = { title: "Thực đơn" };

export default function MenuPage() {
  return (
    // MenuView đọc ?category= bằng useSearchParams nên cần Suspense
    <Suspense fallback={<Loading label="Đang tải thực đơn..." />}>
      <MenuView />
    </Suspense>
  );
}
