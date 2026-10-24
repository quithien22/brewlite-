import type { Metadata } from "next";
import CheckoutView from "@/components/views/CheckoutView";

export const metadata: Metadata = { title: "Thanh toán" };

export default function CheckoutPage() {
  return <CheckoutView />;
}
