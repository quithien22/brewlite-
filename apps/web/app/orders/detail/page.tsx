import type { Metadata } from "next";
import IdRoute from "@/components/ui/IdRoute";
import OrderDetailView from "@/components/views/OrderDetailView";

export const metadata: Metadata = { title: "Chi tiết đơn hàng" };

export default function OrderDetailPage() {
  return <IdRoute view={OrderDetailView} />;
}
