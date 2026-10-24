import { useAuthStore } from "@/store/auth";
import type {
  CouponCheck,
  Order,
  OrderPage,
  OrderStatus,
  PaymentMethod,
  PaymentResult,
  Product,
  ProductDetail,
  Promotion,
  Session,
  SizeCode,
  User,
} from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
  /** status 0 = không gọi được máy chủ (mất mạng / backend tắt) */
  get isNetwork() {
    return this.status === 0;
  }
}

async function request<T>(
  path: string,
  opts: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...opts.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Không thể kết nối tới máy chủ", 0);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) useAuthStore.getState().logout();
    const msg = data?.message;
    throw new ApiError(
      (Array.isArray(msg) ? msg[0] : msg) ?? "Đã có lỗi xảy ra",
      res.status,
    );
  }
  return data as T;
}

function qs(params: Record<string, string | number | boolean | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export interface CreateOrderBody {
  items: {
    productId: number;
    size: SizeCode;
    sugar: string;
    ice: string;
    toppingIds: number[];
    qty: number;
  }[];
  couponCode?: string;
  pointsToUse?: number;
  note?: string;
}

export const api = {
  products: {
    list: (p: { category?: string; search?: string; featured?: boolean } = {}) =>
      request<Product[]>(`/products${qs(p)}`),
    get: (id: number) => request<ProductDetail>(`/products/${id}`),
  },
  promotions: {
    list: () => request<Promotion[]>("/promotions"),
    validate: (code: string, subtotal: number) =>
      request<CouponCheck>("/promotions/validate", {
        method: "POST",
        body: { code, subtotal },
      }),
  },
  auth: {
    register: (body: {
      name: string;
      email: string;
      phone?: string;
      password: string;
    }) => request<Session>("/auth/register", { method: "POST", body }),
    login: (body: { email: string; password: string }) =>
      request<Session>("/auth/login", { method: "POST", body }),
    me: () => request<User>("/auth/me"),
    forgotPassword: (email: string) =>
      request<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: { email },
      }),
  },
  orders: {
    create: (body: CreateOrderBody) =>
      request<Order>("/orders", { method: "POST", body }),
    mine: (p: {
      status?: OrderStatus;
      month?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    }) => request<OrderPage>(`/orders/me${qs(p)}`),
    get: (id: number) => request<Order>(`/orders/${id}`),
    cancel: (id: number) =>
      request<Order>(`/orders/${id}/cancel`, { method: "POST" }),
  },
  payments: {
    pay: (
      body: {
        orderId: number;
        method: PaymentMethod;
        simulateFailure?: boolean;
      },
      idempotencyKey: string,
    ) =>
      request<PaymentResult>("/payments", {
        method: "POST",
        body,
        headers: { "Idempotency-Key": idempotencyKey },
      }),
  },
};
