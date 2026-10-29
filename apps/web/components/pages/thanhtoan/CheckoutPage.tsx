"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Clock, User, Smartphone, QrCode, CreditCard, Lock, Info } from 'lucide-react';
import { useCart } from '../context/CartContext';

const formatMoney = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

export default function CheckoutPage() {
  const { items, totalCartCount, subtotal } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('momo');

  // Nhận tại cửa hàng nên không có phí giao hàng
  const total = subtotal;

  // Giỏ trống thì không có gì để thanh toán
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] font-sans text-[#2B2118]">
        <main className="mx-auto max-w-[1440px] px-[80px] py-[48px]">
          <div className="rounded-2xl border border-[#E5D9CD] bg-white p-12 text-center shadow-sm">
            <h1 className="text-2xl font-bold">Chưa có món nào để thanh toán</h1>
            <p className="mt-2 text-[15px] text-[#74665B]">Hãy chọn vài món từ thực đơn trước nhé.</p>
            <Link
              href="/thuc-don"
              className="mt-6 inline-block rounded-xl bg-[#6F4E37] px-6 py-3 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
            >
              Xem thực đơn
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFAF7] font-sans text-[#2B2118]">
      
      {/* Container chính: rộng 1440px, padding 80px ngang, 48px dọc */}
      <main className="mx-auto max-w-[1440px] px-[80px] py-[48px]">
        
        {/* Tiêu đề trang */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-[#2B2118]">Thanh toán</h1>
          <p className="mt-2 text-[15px] text-[#74665B]">Một bước nữa thôi, ly cà phê của bạn sẽ được chuẩn bị.</p>
        </div>

        {/* Lưới chia cột, khoảng cách 32px */}
        <div className="grid grid-cols-1 items-start gap-[32px] lg:grid-cols-[1.8fr_1.2fr]">
          
          {/* CỘT TRÁI: Thông tin nhận hàng & Thanh toán */}
          <div className="space-y-6">
            
            {/* Panel 1: Nhận tại cửa hàng */}
            <section className="rounded-2xl border border-[#E5D9CD] bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-bold">Nhận tại cửa hàng</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-[13px] font-bold text-[#2B2118]">Cửa hàng</label>
                  <div className="relative">
                    <select className="w-full appearance-none rounded-xl border border-[#E5D9CE] p-4 pr-10 text-[15px] outline-none focus:border-[#6F4E37]">
                      <option>BrewLite Nguyễn Huệ</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-4 text-[#74665B]" size={20} />
                  </div>
                  <p className="mt-2 text-[13px] text-[#74665B]">
                    28 Nguyễn Huệ, Bến Nghé, TP. Hồ Chí Minh · Mở cửa 07:00 – 22:00
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-bold text-[#2B2118]">Thời gian nhận</label>
                  <div className="relative">
                    <select className="w-full appearance-none rounded-xl border border-[#E5D9CE] p-4 pr-10 text-[15px] outline-none focus:border-[#6F4E37]">
                      <option>Càng sớm càng tốt</option>
                    </select>
                    <Clock className="absolute right-4 top-4 text-[#74665B]" size={20} />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-bold text-[#2B2118]">Người nhận</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Họ tên - Số điện thoại"
                      className="w-full rounded-xl border border-[#E5D9CE] p-4 pr-10 text-[15px] text-[#2B2118] placeholder-[#74665B] outline-none focus:border-[#6F4E37]"
                    />
                    <User className="absolute right-4 top-4 text-[#74665B]" size={20} />
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-[#F5EBDD] p-4 text-[13px] text-[#6F4E37]">
                  <Info size={16} />
                  <span>Món được pha mới trước giờ nhận khoảng 5 phút.</span>
                </div>
              </div>
            </section>

            {/* Panel 2: Phương thức thanh toán */}
            <section className="rounded-2xl border border-[#E5D9CD] bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-xl font-bold">Phương thức thanh toán</h2>
              <span className="mb-5 inline-block rounded-full bg-[#F5EBDD] px-3 py-1 text-[12px] font-medium text-[#6F4E37]">
                Không dùng tiền mặt
              </span>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <button 
                  type="button"
                  onClick={() => setPaymentMethod('momo')}
                  className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${paymentMethod === 'momo' ? 'border-[#6F4E37] bg-[#F5EBDD]' : 'border-[#E5D9CE] bg-white'}`}
                >
                  <Smartphone className="mb-4 text-[#6F4E37]" size={24} />
                  <div className="flex items-center gap-2 font-medium">
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${paymentMethod === 'momo' ? 'border-[#6F4E37]' : 'border-gray-300'}`}>
                      {paymentMethod === 'momo' && <div className="h-2 w-2 rounded-full bg-[#6F4E37]"></div>}
                    </div>
                    MoMo
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => setPaymentMethod('vnpay')}
                  className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${paymentMethod === 'vnpay' ? 'border-[#6F4E37] bg-[#F5EBDD]' : 'border-[#E5D9CE] bg-white'}`}
                >
                  <QrCode className="mb-4 text-[#74665B]" size={24} />
                  <div className="flex items-center gap-2 font-medium">
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${paymentMethod === 'vnpay' ? 'border-[#6F4E37]' : 'border-gray-300'}`}>
                      {paymentMethod === 'vnpay' && <div className="h-2 w-2 rounded-full bg-[#6F4E37]"></div>}
                    </div>
                    VNPay
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${paymentMethod === 'card' ? 'border-[#6F4E37] bg-[#F5EBDD]' : 'border-[#E5D9CE] bg-white'}`}
                >
                  <CreditCard className="mb-4 text-[#74665B]" size={24} />
                  <div className="flex items-center gap-2 font-medium">
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${paymentMethod === 'card' ? 'border-[#6F4E37]' : 'border-gray-300'}`}>
                      {paymentMethod === 'card' && <div className="h-2 w-2 rounded-full bg-[#6F4E37]"></div>}
                    </div>
                    Thẻ ngân hàng
                  </div>
                </button>
              </div>

              <p className="mt-4 text-[13px] text-[#74665B]">
                BrewLite không lưu thông tin thanh toán nhạy cảm.
              </p>
            </section>

          </div>

          {/* CỘT PHẢI: Tóm tắt đơn hàng */}
          <div className="space-y-6">
            
            {/* Đơn của bạn: lấy từ giỏ hàng */}
            <section className="rounded-2xl border border-[#E5D9CD] bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-bold">Đơn của bạn</h2>
              
              <div className="space-y-6">
                {items.map((item, index) => (
                  <div
                    key={item.cartItemId}
                    className={`flex gap-4 ${index > 0 ? 'border-t border-[#E5D9CD] pt-6' : ''}`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-[80px] w-[80px] shrink-0 rounded-xl object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-[#2B2118]">{item.name}</h3>
                      <p className="text-[13px] text-[#74665B]">
                        {item.sizeName}
                        {item.toppings.length > 0 && ` - ${item.toppings.map((t) => t.name).join(', ')}`}
                      </p>
                      <p className="mt-1 text-[14px] font-medium text-[#74665B]">
                        {formatMoney(item.price)} × {item.quantity} = {formatMoney(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Tóm tắt đơn hàng */}
            <section className="rounded-2xl border border-[#E5D9CD] bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-bold">Tóm tắt đơn hàng</h2>
              
              <div className="space-y-3 border-b border-[#E5D9CD] pb-5 text-[14px] text-[#74665B]">
                <div className="flex justify-between">
                  <span>Tạm tính - {totalCartCount} sản phẩm</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-[16px] font-bold">Tổng cộng</span>
                <span className="text-[24px] font-bold text-[#6F4E37]">{formatMoney(total)}</span>
              </div>
              
              <div className="mt-4 text-[13px] text-[#74665B]">
                <p>Đã bao gồm thuế. Nhận tại cửa hàng, không có phí giao hàng.</p>
                <p className="mt-2">Thanh toán an toàn - Không dùng tiền mặt</p>
              </div>

              <Link
                href="/thanh-toan/thanh-cong"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6F4E37] py-4 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
              >
                <Lock size={18} />
                Xác nhận thanh toán
              </Link>

              <div className="mt-4 text-center">
                <Link href="/gio-hang" className="text-[13px] font-semibold text-[#6F4E37] hover:underline">
                  ← Quay lại giỏ hàng
                </Link>
              </div>

              <p className="mt-4 text-center text-[12px] text-[#74665B]">
                Khi tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách thanh toán của BrewLite.
              </p>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
