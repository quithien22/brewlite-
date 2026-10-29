'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ValidatedItemInfo {
  productId: number;
  maxStock?: number;
  isValid: boolean;
  errorMessage: string | null;
}

interface PromotionItem {
  id: number;
  code: string;
  title: string;
  description: string;
  minOrder: number;
}

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    removeFromCart,
    subtotal,
    shippingFee,
    totalPrice,
  } = useCart();

  // State kết nối Backend Cart API
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    title?: string;
    discount: number;
    message?: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [itemValidationMap, setItemValidationMap] = useState<Record<number, ValidatedItemInfo>>({});
  const [isCartValid, setIsCartValid] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  // 1. Lấy danh sách mã khuyến mãi đang hoạt động từ Backend
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/cart/promotions`);
        if (res.ok) {
          const data = await res.json();
          setPromotions(Array.isArray(data) ? data : []);
        }
      } catch {
        // Bỏ qua nếu server chưa bật
      }
    };
    fetchPromotions();
  }, []);

  // 2. Tự động kiểm tra tồn kho giỏ hàng với Backend mỗi khi items thay đổi
  useEffect(() => {
    if (items.length === 0) {
      setItemValidationMap({});
      setIsCartValid(true);
      setAppliedCoupon(null);
      return;
    }

    const validateCartWithBackend = async () => {
      setIsValidating(true);
      try {
        const payload = {
          items: items.map((item: any) => ({
            productId: Number(item.productId ?? item.id),
            qty: item.quantity,
            size: item.sizeName || 'S',
            sugar: item.sugar || '100%',
            ice: item.ice || '100%',
            toppings: item.toppings || [],
          })),
          couponCode: appliedCoupon?.code || undefined,
        };

        const res = await fetch(`${API_BASE_URL}/cart/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          setIsCartValid(Boolean(data.isValid));

          const map: Record<number, ValidatedItemInfo> = {};
          if (Array.isArray(data.items)) {
            for (const vItem of data.items) {
              map[vItem.productId] = {
                productId: vItem.productId,
                maxStock: vItem.maxStock,
                isValid: vItem.isValid,
                errorMessage: vItem.errorMessage,
              };
            }
          }
          setItemValidationMap(map);

          // Cập nhật lại số tiền giảm giá nếu đơn hàng thay đổi tổng tạm tính
          if (data.coupon) {
            if (data.coupon.valid) {
              setAppliedCoupon({
                code: data.coupon.code,
                title: data.coupon.title,
                discount: data.coupon.discount,
                message: data.coupon.message,
              });
              setCouponError(null);
            } else {
              setAppliedCoupon(null);
              setCouponError(data.coupon.message || 'Mã giảm giá không còn hợp lệ');
            }
          }
        }
      } catch {
        // Nếu không gọi được backend, tạm thời cho phép thao tác bình thường ở client
      } finally {
        setIsValidating(false);
      }
    };

    validateCartWithBackend();
  }, [items]);

  // 3. Xử lý áp dụng mã giảm giá qua API POST /cart/apply-coupon
  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply ?? couponInput).trim().toUpperCase();
    if (!code) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/cart/apply-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          subtotal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAppliedCoupon(null);
        setCouponError(data.message || 'Không thể áp dụng mã giảm giá này');
        localStorage.removeItem('appliedCoupon');
        return;
      }

      const couponData = {
        code: data.code,
        title: data.title,
        discount: data.discount,
        message: data.message,
      };
      setAppliedCoupon(couponData);
      setCouponInput(data.code);
      localStorage.setItem('appliedCoupon', JSON.stringify(couponData));
    } catch {
      setCouponError('Không thể kết nối tới máy chủ để kiểm tra mã');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
    localStorage.removeItem('appliedCoupon');
  };

  const discountAmount = appliedCoupon?.discount || 0;
  const finalTotalPrice = Math.max(totalPrice - discountAmount, 0);

  const handleProceedToCheckout = () => {
    if (!isCartValid) {
      alert('Một số sản phẩm trong giỏ hàng vượt quá số lượng tồn kho hoặc đã ngừng bán. Vui lòng điều chỉnh lại!');
      return;
    }
    router.push('/thanh-toan');
  };

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-stone-900">Giỏ hàng của bạn</h1>
          <p className="text-stone-500 mt-1">
            Bạn đang có <span className="font-semibold text-amber-900">{items.length} món</span> trong giỏ
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-stone-200">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-800">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-stone-800 mb-2">Giỏ hàng đang trống</h2>
            <p className="text-stone-500 mb-6">Hãy chọn thêm vài ly cafe thơm ngon nhé!</p>
            <Link
              href="/thuc-don"
              className="inline-flex items-center px-6 py-3 bg-amber-900 hover:bg-amber-800 text-white font-medium rounded-xl transition shadow-sm"
            >
              Xem thực đơn ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item: any) => {
                const productId = Number(item.productId ?? item.id);
                const validation = itemValidationMap[productId];
                const hasStockError = validation && !validation.isValid;

                return (
                  <div
                    key={item.cartItemId}
                    className={`bg-white p-4 sm:p-5 rounded-2xl shadow-sm border flex flex-col sm:flex-row items-center gap-4 transition hover:shadow-md ${
                      hasStockError ? 'border-red-400 bg-red-50/20' : 'border-stone-200'
                    }`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 rounded-xl object-cover border border-stone-100 flex-shrink-0"
                    />

                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-bold text-stone-800 text-lg">{item.name}</h3>
                      <p className="text-sm font-medium text-stone-600 mt-0.5">
                        {item.sizeName}
                      </p>
                      {item.toppings && item.toppings.length > 0 && (
                        <p className="text-xs text-amber-900/80 mt-1">
                          <span className="font-semibold">Topping:</span>{' '}
                          {item.toppings.map((t: any) => t.name).join(', ')}
                        </p>
                      )}
                      <span className="font-semibold text-amber-900 inline-block mt-1">
                        {item.price.toLocaleString('vi-VN')} đ
                      </span>

                      {/* Hiển thị thông báo tồn kho từ Backend */}
                      {validation?.maxStock !== undefined && validation.isValid && (
                        <p className="text-xs text-stone-400 mt-1">
                          Kho còn: {validation.maxStock} sản phẩm
                        </p>
                      )}
                      {hasStockError && (
                        <p className="text-xs font-semibold text-red-600 mt-1">
                          ⚠️ {validation.errorMessage}
                        </p>
                      )}
                    </div>

                    {/* Tăng / giảm số lượng */}
                    <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartItemId, -1)}
                        className="px-3 py-1.5 text-stone-600 hover:bg-stone-200 transition font-bold"
                      >
                        -
                      </button>
                      <span className="px-4 py-1.5 font-semibold text-stone-800 min-w-[2.5rem] text-center bg-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartItemId, 1)}
                        disabled={
                          validation?.maxStock !== undefined &&
                          item.quantity >= validation.maxStock
                        }
                        className="px-3 py-1.5 text-stone-600 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold"
                      >
                        +
                      </button>
                    </div>

                    {/* Thành tiền và nút Xóa */}
                    <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                      <p className="font-bold text-stone-900">
                        {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="text-stone-400 hover:text-red-500 transition p-1"
                        title="Xóa món này"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cột tóm tắt đơn hàng */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 sticky top-6">
                <h2 className="text-xl font-bold text-stone-900 mb-6">Tóm tắt đơn hàng</h2>

                {/* Khu vực nhập Mã giảm giá (kết nối Backend /cart/apply-coupon) */}
                <div className="mb-5 pb-5 border-b border-stone-100">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                    Mã khuyến mãi
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Nhập mã (VD: CHAO10)"
                      className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:border-amber-800 uppercase"
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition"
                      >
                        Bỏ mã
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={isApplyingCoupon}
                        className="px-4 py-2 text-xs font-semibold text-white bg-stone-800 hover:bg-stone-700 disabled:opacity-50 rounded-xl transition"
                      >
                        {isApplyingCoupon ? 'Đang kiểm tra...' : 'Áp dụng'}
                      </button>
                    )}
                  </div>

                  {couponError && (
                    <p className="text-xs text-red-600 mt-2">{couponError}</p>
                  )}

                  {appliedCoupon && (
                    <p className="text-xs text-emerald-700 font-medium mt-2">
                      ✓ Đã áp dụng mã <span className="font-bold">{appliedCoupon.code}</span> (-
                      {appliedCoupon.discount.toLocaleString('vi-VN')} đ)
                    </p>
                  )}

                  {/* Gợi ý nhanh các mã khuyến mãi lấy từ Backend */}
                  {promotions.length > 0 && !appliedCoupon && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {promotions.map((promo) => (
                        <button
                          key={promo.id}
                          type="button"
                          onClick={() => {
                            setCouponInput(promo.code);
                            handleApplyCoupon(promo.code);
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition"
                          title={promo.description || promo.title}
                        >
                          🏷️ {promo.code}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3 border-b border-stone-100 pb-4 mb-4 text-sm">
                  <div className="flex justify-between text-stone-600">
                    <span>Tạm tính</span>
                    <span className="font-medium text-stone-900">
                      {subtotal.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Phí vận chuyển</span>
                    <span className="font-medium text-stone-900">
                      {shippingFee.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Giảm giá ({appliedCoupon?.code})</span>
                      <span className="font-semibold">
                        -{discountAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-base font-bold text-stone-900">Tổng cộng</span>
                  <span className="text-2xl font-black text-amber-900">
                    {finalTotalPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  disabled={!isCartValid || isValidating}
                  className="w-full block text-center py-3.5 px-4 bg-amber-900 hover:bg-amber-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition duration-200 shadow-md hover:shadow-lg"
                >
                  {isValidating ? 'Đang kiểm tra kho...' : 'Tiến hành thanh toán'}
                </button>

                <div className="mt-4 text-center">
                  <Link
                    href="/thuc-don"
                    className="text-sm font-medium text-stone-500 hover:text-amber-900 transition"
                  >
                    ← Tiếp tục chọn món
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}