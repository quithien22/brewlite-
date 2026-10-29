import type { Metadata } from "next";
import IdRoute from "@/components/ui/IdRoute";
import OrderFailedView from "@/components/views/OrderFailedView";

export const metadata: Metadata = { title: "Thanh toán thất bại" };

export default function OrderFailedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <IdRoute params={params}>{(id) => <OrderFailedView id={id} />}</IdRoute>
  );
}
