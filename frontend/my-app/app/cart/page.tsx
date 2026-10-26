<<<<<<< HEAD
import CartPage from "../../components/pages/giohang/CartPage";

export default function Page() {
   return (
    <div className="bg-white min-h-screen">
      <CartPage />
    </div>
  );
=======

import type { Metadata } from "next";
import CartView from "@/components/views/CartView";

export const metadata: Metadata = {
  title: "Giỏ hàng",
};

export default function CartPage() {
  return <CartView />;
>>>>>>> 42b4564ad28e7c14134ecbfe41ece011e71e6ade
}
