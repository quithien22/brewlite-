import type { Metadata } from "next";
import OrdersView from "@/components/views/OrdersView";

export const metadata: Metadata = { title: "Lịch sử đơn hàng" };

export default function OrdersPage() {
  return <OrdersView />;
}
