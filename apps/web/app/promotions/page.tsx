import type { Metadata } from "next";
import PromotionsView from "@/components/views/PromotionsView";

export const metadata: Metadata = { title: "Khuyến mãi" };

export default function PromotionsPage() {
  return <PromotionsView />;
}
