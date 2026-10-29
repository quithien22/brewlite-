import type { Metadata } from "next";
import CheckoutView from "@/components/views/CheckoutView";
// thanh toán
export const metadata: Metadata = { title: "Thanh toán" };

export default function CheckoutPage() {
  return <CheckoutView />;
}
