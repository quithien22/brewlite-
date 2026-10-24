export type SizeCode = "S" | "M" | "L";

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "PAYMENT_FAILED"
  | "CANCELLED";

export type PaymentMethod = "WALLET" | "CARD";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "CUSTOMER" | "STAFF";
  loyaltyPoints: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  stock: number;
  isFeatured: boolean;
  inStock: boolean;
}

export interface Topping {
  id: number;
  name: string;
  price: number;
}

export interface SizeOption {
  code: SizeCode;
  label: string;
  extra: number;
}

export interface ProductDetail extends Product {
  options: {
    sizes: SizeOption[];
    toppings: Topping[];
    sugarLevels: string[];
    iceLevels: string[];
    defaultSugar: string;
    defaultIce: string;
  };
}

export interface Promotion {
  code: string;
  title: string;
  description: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  endsAt: string;
}

export interface CouponCheck {
  valid: boolean;
  code: string;
  title?: string;
  discount: number;
  message: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  name: string;
  imageUrl: string;
  size: SizeCode;
  sugar: string;
  ice: string;
  toppings: Topping[];
  unitPrice: number;
  qty: number;
  lineTotal: number;
}

export interface Payment {
  id: number;
  method: PaymentMethod;
  provider: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  amount: number;
  transactionId: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface Order {
  id: number;
  code: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  pointsUsed: number;
  pointsDiscount: number;
  total: number;
  note: string | null;
  pointsEarned: number;
  pointsAwarded: boolean;
  canCancel: boolean;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payment: Payment | null;
  timeline: { status: OrderStatus; at: string }[];
}

export interface OrderPage {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaymentResult {
  success: boolean;
  replayed: boolean;
  payment: Payment;
  order: Order;
}

export interface Session {
  accessToken: string;
  user: User;
}

export interface CartLine {
  key: string;
  productId: number;
  name: string;
  imageUrl: string;
  size: SizeCode;
  sugar: string;
  ice: string;
  toppings: Topping[];
  unitPrice: number;
  qty: number;
}
