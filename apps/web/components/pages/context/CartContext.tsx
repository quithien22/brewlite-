'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartTopping {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  cartItemId: string; // Khóa duy nhất: `${productId}-${sizeId}-${toppingIds}`
  productId: number;
  name: string;
  image: string;
  sizeId: string;
  sizeName: string;
  toppings: CartTopping[];
  price: number; // Đơn giá 1 ly sau khi cộng size và toppings
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'cartItemId'>) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  totalCartCount: number;
  subtotal: number;
  shippingFee: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Đọc dữ liệu từ localStorage khi component mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('brewlite_cart');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Không thể đọc giỏ hàng từ localStorage:', error);
    }
    setIsInitialized(true);
  }, []);

  // Tự động lưu vào localStorage mỗi khi items thay đổi
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('brewlite_cart', JSON.stringify(items));
      } catch (error) {
        console.error('Không thể lưu giỏ hàng vào localStorage:', error);
      }
    }
  }, [items, isInitialized]);

  // Thêm món vào giỏ hàng
  const addToCart = (newItem: Omit<CartItem, 'cartItemId'>) => {
    // Tạo khóa phân biệt: cùng món, cùng size, cùng topping thì gộp số lượng
    const sortedToppingIds = newItem.toppings
      .map((t) => t.id)
      .sort()
      .join('_');
    const cartItemId = `${newItem.productId}-${newItem.sizeId}-${sortedToppingIds}`;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
        };
        return updated;
      }
      return [...prevItems, { ...newItem, cartItemId }];
    });
  };

  // Cập nhật số lượng (+1 hoặc -1)
  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Xóa món khỏi giỏ
  const removeFromCart = (cartItemId: string) => {
    setItems((prevItems) => prevItems.filter((i) => i.cartItemId !== cartItemId));
  };

  // Làm trống giỏ (dùng khi đặt hàng thành công)
  const clearCart = () => {
    setItems([]);
  };

  // Tính toán số lượng và chi phí
  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = items.length > 0 ? 15000 : 0;
  const totalPrice = subtotal + shippingFee;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalCartCount,
        subtotal,
        shippingFee,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart phải được sử dụng bên trong CartProvider');
  }
  return context;
}

