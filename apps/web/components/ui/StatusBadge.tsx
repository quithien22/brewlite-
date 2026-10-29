import { STATUS_LABEL } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

const STYLE: Record<OrderStatus, string> = {
  PENDING: "bg-[#FFF3D6] text-[#8A5A00]",
  PAID: "bg-[#E6F3EA] text-[#1E7A43]",
  PREPARING: "bg-cream text-brand",
  READY: "bg-[#E3EEF9] text-[#2B5C8F]",
  COMPLETED: "bg-[#E3F1EC] text-[#1D6B52]",
  CANCELLED: "bg-[#EAE3DC] text-muted",
  PAYMENT_FAILED: "bg-[#FBE7E7] text-danger",
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
