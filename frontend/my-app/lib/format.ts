import type { OrderStatus, PaymentMethod, Topping } from "./types";

/** 1 điểm thưởng = 500đ (khớp backend common/pricing.ts) */
export const POINT_VALUE = 500;

export const STORE = {
  name: "BrewLite Nguyễn Huệ",
  address: "28 Nguyễn Huệ, Bến Nghé, TP. Hồ Chí Minh",
  phone: "1900 1042",
};

export const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

const pad = (n: number) => String(n).padStart(2, "0");

export function formatTime(iso: string | Date) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(iso: string | Date) {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatDateTime(iso: string | Date) {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  PREPARING: "Đang pha chế",
  READY: "Sẵn sàng",
  COMPLETED: "Hoàn thành",
  PAYMENT_FAILED: "Thanh toán thất bại",
  CANCELLED: "Đã hủy",
};

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  WALLET: "MoMo",
  CARD: "VNPay",
};

export function describeOptions(o: {
  size: string;
  toppings: Topping[];
  sugar: string;
  ice: string;
}) {
  const parts = [`Cỡ ${o.size}`];
  if (o.toppings.length) parts.push(o.toppings.map((t) => t.name).join(", "));
  parts.push(`${o.sugar} đường`, o.ice);
  return parts.join(" · ");
}

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
