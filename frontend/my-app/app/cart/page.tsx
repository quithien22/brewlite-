import type { Metadata } from "next";
import CartView from "@/components/views/CartView";

export const metadata: Metadata = { title: "Giỏ hàng" };

export default function CartPage() {
  return <CartView />;
}
