import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/lib/types";

export interface AppliedCoupon {
  code: string;
  title: string;
  discount: number;
}

interface CartState {
  lines: CartLine[];
  note: string;
  coupon: AppliedCoupon | null;
  pointsToUse: number;
  /** Đơn PENDING/PAYMENT_FAILED vừa tạo từ giỏ này (để hủy khi tạo lại). */
  pendingOrderId: number | null;
  hydrated: boolean;

  addLine: (line: Omit<CartLine, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setNote: (note: string) => void;
  setCoupon: (coupon: AppliedCoupon | null) => void;
  setPointsToUse: (points: number) => void;
  setPendingOrderId: (id: number | null) => void;
}

export const MAX_QTY = 20;

export function makeLineKey(l: Omit<CartLine, "key" | "qty" | "unitPrice">) {
  const tops = l.toppings
    .map((t) => t.id)
    .sort((a, b) => a - b)
    .join(",");
  return `${l.productId}|${l.size}|${l.sugar}|${l.ice}|${tops}`;
}

export const cartCount = (lines: CartLine[]) =>
  lines.reduce((n, l) => n + l.qty, 0);
export const cartSubtotal = (lines: CartLine[]) =>
  lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      note: "",
      coupon: null,
      pointsToUse: 0,
      pendingOrderId: null,
      hydrated: false,

      addLine: (line) =>
        set((s) => {
          const key = makeLineKey(line);
          const found = s.lines.find((l) => l.key === key);
          if (found) {
            return {
              lines: s.lines.map((l) =>
                l.key === key
                  ? {
                      ...l,
                      unitPrice: line.unitPrice,
                      qty: Math.min(MAX_QTY, l.qty + line.qty),
                    }
                  : l,
              ),
            };
          }
          return {
            lines: [
              ...s.lines,
              { ...line, key, qty: Math.min(MAX_QTY, line.qty) },
            ],
          };
        }),

      setQty: (key, qty) =>
        set((s) => ({
          lines: s.lines.map((l) =>
            l.key === key
              ? { ...l, qty: Math.max(1, Math.min(MAX_QTY, qty)) }
              : l,
          ),
        })),

      remove: (key) =>
        set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),

      clear: () =>
        set({
          lines: [],
          note: "",
          coupon: null,
          pointsToUse: 0,
          pendingOrderId: null,
        }),

      setNote: (note) => set({ note }),
      setCoupon: (coupon) => set({ coupon }),
      setPointsToUse: (pointsToUse) => set({ pointsToUse }),
      setPendingOrderId: (pendingOrderId) => set({ pendingOrderId }),
    }),
    {
      name: "brewlite-cart",
      skipHydration: true,
      partialize: (s) => ({
        lines: s.lines,
        note: s.note,
        coupon: s.coupon,
        pointsToUse: s.pointsToUse,
        pendingOrderId: s.pendingOrderId,
      }),
      onRehydrateStorage: () => () => {
        useCartStore.setState({ hydrated: true });
      },
    },
  ),
);
