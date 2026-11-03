import type { Metadata } from "next";
import IdRoute from "@/components/ui/IdRoute";
import OrderSuccessView from "@/components/views/OrderSuccessView";

export const metadata: Metadata = { title: "Đặt hàng thành công" };

export default function OrderSuccessPage() {
  return <IdRoute view={OrderSuccessView} />;
}
