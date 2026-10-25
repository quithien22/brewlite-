"use client";

import React, { useState } from "react";
import {
  Check, Coffee, ShoppingBag, CircleCheck, Info, Phone,
  XCircle, RotateCcw, AlertCircle,
} from "lucide-react";

/**
 * BrewLite / Chi tiết đơn hàng - frontend demo.
 * Không gửi yêu cầu thanh toán/hủy đơn thật; khi kết nối API hãy lấy đơn theo id.
 * Header/Footer dùng chung của nhóm nên không render lại tại đây.
 */

type OrderStatus = "paid" | "preparing" | "ready" | "completed" | "cancelled";

const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value) + "đ";
const ORDER = {
  id: "1042",
  placedAt: "09:30 · 09/10/2026",
  updatedAt: "09:35",
  pickupAt: "09:45",
  customer: "Nguyễn Minh Anh",
  phone: "0901 234 567",
  store: "BrewLite Nguyễn Huệ",
  address: "28 Nguyễn Huệ, Bến Nghé, TP. Hồ Chí Minh",
  payment: "MoMo",
  transactionId: "BL1042MOMO",
  note: "Pha đậm hơn một chút giúp mình nhé.",
  products: [
    {
      id: "coffee",
      name: "Cà phê sữa đá",
      detail: "Cỡ M · Kem cheese · 50% đường · Ít đá",
      price: 58000,
      quantity: 2,
      image: "/images/menu/ca-phe-sua-da.jpg",
    },
    {
      id: "tea",
      name: "Trà đào cam sả",
      detail: "Cỡ S · 100% đường · Đá bình thường",
      price: 45000,
      quantity: 1,
      image: "/images/menu/tra-dao-cam-sa.jpg",
    },
  ],
  discount: 16100,
  pointsUsed: 0,
};

const steps = [
  { id: "paid", title: "Đã thanh toán", time: "09:30", icon: Check },
  { id: "preparing", title: "Đang pha chế", time: "09:35", icon: Coffee },
  { id: "ready", title: "Sẵn sàng", time: "Dự kiến 09:45", icon: ShoppingBag },
  { id: "completed", title: "Hoàn thành", time: "Sau khi nhận món", icon: CircleCheck },
] as const;

const statusRank: Record<Exclude<OrderStatus, "cancelled">, number> = {
  paid: 0,
  preparing: 1,
  ready: 2,
  completed: 3,
};

function Panel({
  title, children, className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-[#E5D9CD] bg-white p-6 shadow-[0_6px_18px_rgba(59,35,22,0.055)] ${className}`}>
      <h2 className="mb-5 text-[19px] font-bold text-[#2B2118]">{title}</h2>
      {children}
    </section>
  );
}

function Pill({ children, green = false }: { children: React.ReactNode; green?: boolean }) {
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${green ? "bg-[#E8F5EC] text-[#287346]" : "bg-[#F5EBDD] text-[#6F4E37]"}`}>
      {children}
    </span>
  );
}

export default function OrderDetailPage() {
  const [status] = useState<OrderStatus>("preparing");
  const [demoCancelled, setDemoCancelled] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const subtotal = ORDER.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const total = subtotal - ORDER.discount - ORDER.pointsUsed;
  const currentRank = status === "cancelled" ? -1 : statusRank[status];

  return (
    <div className="min-h-screen bg-[#FCFAF7] font-sans text-[#2B2118]">
      <main className="mx-auto max-w-[1440px] px-5 py-12 sm:px-10 lg:px-20">
        {/* Phần đầu */}
        <header className="mb-8">
          <p className="mb-2 text-[13px] font-semibold text-[#6F4E37]">Lịch sử đơn / #{ORDER.id}</p>
          <h1 className="text-[36px] font-extrabold tracking-tight text-[#2B2118]">Đơn hàng #{ORDER.id}</h1>
          <p className="mt-2 text-[14px] text-[#74665B]">
            Đặt lúc {ORDER.placedAt} · Cập nhật lúc {ORDER.updatedAt}
          </p>
          <div className="mt-6">
            <Pill green={status === "completed"}>
              {status === "paid" ? "Đã thanh toán" : status === "preparing" ? "Đang pha chế" : status === "ready" ? "Sẵn sàng" : status === "completed" ? "Hoàn thành" : "Đã hủy"}
            </Pill>
          </div>
        </header>

        {/* Tiến trình đơn hàng */}
        <div className="mb-8 rounded-2xl border border-[#E5D9CD] bg-white p-6 shadow-[0_6px_18px_rgba(59,35,22,0.055)]">
          <h2 className="mb-5 text-[20px] font-bold">
            {status === "cancelled" ? "Đơn hàng đã được hủy (minh họa)" : status === "completed" ? "Cảm ơn bạn đã ghé BrewLite!" : status === "ready" ? "Ly cà phê của bạn đã sẵn sàng" : status === "paid" ? "Đơn hàng đang chờ pha chế" : "Ly cà phê đang được chuẩn bị"}
          </h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const achieved = index <= currentRank;
              return (
                <div key={step.id} className="min-w-0">
                  <span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${achieved ? "bg-[#6F4E37] text-white" : "bg-[#F1E7DB] text-[#927F70]"}`}>
                    <Icon size={22} strokeWidth={1.5} />
                  </span>
                  <h3 className={`text-[14px] font-bold ${achieved ? "text-[#6F4E37]" : "text-[#74665B]"}`}>{step.title}</h3>
                  <p className="mt-2 text-xs text-[#8A7D73]">{step.time}</p>
                  <div className={`mt-2 h-[4px] rounded-full ${achieved ? "bg-[#6F4E37]" : "bg-[#EEE5DC]"}`} />
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex gap-3 rounded-xl bg-[#F5EBDD] p-4 text-[13px] text-[#6F4E37]">
            <Info size={17} className="shrink-0" />
            <span>{status === "cancelled" ? "Đây là trạng thái hủy đơn minh họa, chưa kết nối hệ thống đặt hàng." : "Chúng mình sẽ thông báo khi món sẵn sàng. Hẹn gặp bạn lúc 09:45!"}</span>
          </div>
        </div>

        {/* Chi tiết & tổng kết: dùng lưới thẻ giống CheckoutPage */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.8fr_1.2fr]">
          <div className="space-y-6">
            <Panel title="Chi tiết món">
              <div className="space-y-6">
                {ORDER.products.map((product) => (
                  <div key={product.id} className="flex gap-4">
                    {/* Ảnh từ public/images/menu - dùng chung với trang thanh toán */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.image} alt={product.name} className="h-[96px] w-[96px] shrink-0 rounded-xl bg-[#F5EBDD] object-cover" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[#2B2118]">{product.name}</h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#74665B]">{product.detail}</p>
                      <p className="mt-1 text-[13px] font-medium text-[#6F4E37]">
                        {money(product.price)} × {product.quantity} = {money(product.price * product.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[13px] text-[#74665B]">Ghi chú: {ORDER.note}</p>
            </Panel>
            <Panel title="Thông tin nhận món">
              <p className="font-bold">{ORDER.store}</p>
              <p className="mt-4 text-[14px] leading-6 text-[#74665B]">
                {ORDER.address}<br />
                Người nhận: {ORDER.customer} · {ORDER.phone}<br />
                Thời gian nhận: Hôm nay · {ORDER.pickupAt}
              </p>
              <a href="tel:19001042" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#6F4E37] px-5 py-3 text-[14px] font-semibold text-[#6F4E37] hover:bg-[#F5EBDD]">
                <Phone size={17} /> Liên hệ cửa hàng
              </a>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Tóm tắt đơn hàng">
              <div className="space-y-3 border-b border-[#E5D9CD] pb-5 text-[14px] text-[#74665B]">
                <div className="flex justify-between gap-3"><span>Tạm tính · 3 sản phẩm</span><span>{money(subtotal)}</span></div>
                <div className="flex justify-between gap-3"><span>Ưu đãi CHAO10 · 10%</span><span>−{money(ORDER.discount)}</span></div>
                <div className="flex justify-between gap-3"><span>Điểm thưởng sử dụng</span><span>{money(ORDER.pointsUsed)}</span></div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-4">
                <span className="text-[15px] font-bold">Tổng cộng</span>
                <span className="text-[25px] font-extrabold text-[#6F4E37]">{money(total)}</span>
              </div>
              <p className="mt-4 text-[13px] leading-5 text-[#74665B]">Đã bao gồm thuế. Nhận tại cửa hàng, không có phí giao hàng.</p>
              <p className="mt-3 text-[13px] text-[#6F4E37]">Thanh toán an toàn · Không dùng tiền mặt</p>
            </Panel>
            <Panel title="Thông tin thanh toán">
              <Pill green>Đã thanh toán</Pill>
              <p className="mt-4 text-[13px] leading-6 text-[#2B2118]">
                {ORDER.payment} · 09:30 ngày 09/10/2026<br />
                Mã giao dịch: {ORDER.transactionId}<br />
                Số tiền đã thanh toán: {money(total)}
              </p>
            </Panel>
            <button disabled className="w-full cursor-not-allowed rounded-xl bg-[#E6E0DA] px-5 py-4 text-[14px] font-semibold text-[#84796F]">
              Hủy đơn
            </button>
            <p className="text-[13px] leading-5 text-[#74665B]">
              Đơn đang pha chế nên không thể hủy. Cần hỗ trợ? Gọi 1900 1042.
            </p>
          </div>
        </div>

        {/* Trạng thái mẫu, giống section cuối trong Figma */}
        <section className="mt-9 rounded-2xl bg-[#F5EBDD] p-6 sm:p-9">
          <h2 className="mb-6 text-[20px] font-bold">Các trạng thái hiển thị</h2>
          <div className="rounded-2xl border border-[#E5D9CD] bg-white p-6 shadow-sm">
            {demoCancelled ? (
              <>
                <div className="mb-3 flex items-center gap-2 text-[#6F4E37]"><XCircle size={20} /><h3 className="text-lg font-bold">Đã hủy đơn hàng (bản demo)</h3></div>
                <p className="text-[14px] leading-6 text-[#74665B]">Trạng thái hủy đã được mô phỏng ở giao diện. Chưa có giao dịch hoàn tiền hoặc thay đổi dữ liệu máy chủ.</p>
                <button onClick={() => setDemoCancelled(false)} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#6F4E37] px-5 py-3 text-[14px] font-semibold text-[#6F4E37] hover:bg-[#F5EBDD]"><RotateCcw size={16} /> Khôi phục mẫu</button>
              </>
            ) : (
              <>
                <h3 className="mb-3 text-lg font-bold">Khi đơn chưa bắt đầu pha chế</h3>
                <Pill green>Đã thanh toán</Pill>
                <p className="mt-4 max-w-[870px] text-[14px] leading-6 text-[#74665B]">
                  Đơn có thể hủy trước khi cửa hàng bắt đầu pha chế. Tiền sẽ được hoàn về phương thức thanh toán ban đầu trong 3–5 ngày làm việc (theo chính sách minh họa).
                </p>
                <button onClick={() => setShowCancelConfirm(true)} className="mt-4 rounded-xl border border-[#6F4E37] px-5 py-3 text-[14px] font-semibold text-[#6F4E37] hover:bg-[#F5EBDD]">Hủy đơn hàng</button>
              </>
            )}
          </div>
          <p className="mt-4 text-xs text-[#74665B]">Khu vực này chỉ dùng để minh họa các trạng thái thiết kế, không ảnh hưởng đơn hàng đang hiển thị phía trên.</p>
        </section>
      </main>

      {showCancelConfirm && (
        <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowCancelConfirm(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="cancel-title" className="w-full max-w-[440px] rounded-2xl bg-white p-7 shadow-xl">
            <div className="mb-3 flex items-center gap-3 text-[#6F4E37]"><AlertCircle size={24} /><h2 id="cancel-title" className="text-xl font-bold">Xác nhận hủy đơn mẫu?</h2></div>
            <p className="text-sm leading-6 text-[#74665B]">Thao tác này chỉ thay đổi giao diện demo. Không hủy đơn thật hoặc hoàn tiền.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCancelConfirm(false)} className="rounded-lg border border-[#E5D9CD] px-4 py-3 text-sm">Quay lại</button>
              <button onClick={() => { setDemoCancelled(true); setShowCancelConfirm(false); }} className="rounded-lg bg-[#6F4E37] px-4 py-3 text-sm font-semibold text-white">Xác nhận demo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
