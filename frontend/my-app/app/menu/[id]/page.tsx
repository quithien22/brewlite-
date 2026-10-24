import type { Metadata } from "next";
import IdRoute from "@/components/ui/IdRoute";
import ProductDetailView from "@/components/views/ProductDetailView";

export const metadata: Metadata = { title: "Chi tiết sản phẩm" };

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <IdRoute params={params}>{(id) => <ProductDetailView id={id} />}</IdRoute>
  );
}
