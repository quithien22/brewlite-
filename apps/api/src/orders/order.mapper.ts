import type { Prisma } from '@prisma/client';
import { POINT_VALUE } from '../common/pricing';
import { refundWindowMs } from '../common/constants';
import { CANCELLABLE_STATUSES } from './order-state-machine';

export const ORDER_INCLUDE = {
  items: { orderBy: { id: 'asc' } },
  payments: { orderBy: { id: 'desc' }, take: 1 },
  statusLogs: { orderBy: { id: 'asc' } },
} satisfies Prisma.OrderInclude;

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof ORDER_INCLUDE;
}>;

interface ToppingSnapshot {
  id: number;
  name: string;
  price: number;
}

/** Chuyển bản ghi DB sang JSON trả về cho frontend. */
export function mapOrder(order: OrderWithRelations) {
  const payment = order.payments[0] ?? null;

  // Hạn hủy + hoàn tiền: tính từ lúc đơn chuyển sang PAID
  const paidAt = [...order.statusLogs]
    .reverse()
    .find((l) => l.status === 'PAID')?.createdAt;
  const refundUntil =
    order.status === 'PAID' && paidAt
      ? new Date(paidAt.getTime() + refundWindowMs())
      : null;
  const canRefund =
    refundUntil !== null &&
    refundUntil.getTime() > Date.now() &&
    payment?.status === 'SUCCESS';

  return {
    id: order.id,
    code: `#${order.id}`,
    status: order.status,
    subtotal: order.subtotal,
    discount: order.discount,
    couponCode: order.couponCode,
    pointsUsed: order.pointsUsed,
    pointsDiscount: order.pointsUsed * POINT_VALUE,
    total: order.total,
    note: order.note,
    pointsEarned: order.pointsEarned,
    pointsAwarded: order.pointsAwarded,
    canCancel: CANCELLABLE_STATUSES.includes(order.status),
    canRefund,
    refundUntil,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      name: i.productName,
      imageUrl: i.imageUrl,
      size: i.size,
      sugar: i.sugar,
      ice: i.ice,
      toppings: (i.toppings as unknown as ToppingSnapshot[]) ?? [],
      unitPrice: i.unitPrice,
      qty: i.qty,
      lineTotal: i.lineTotal,
    })),
    payment: payment && {
      id: payment.id,
      method: payment.method,
      provider: payment.provider,
      status: payment.status,
      amount: payment.amount,
      transactionId: payment.transactionId,
      failureReason: payment.failureReason,
      refundedAt: payment.refundedAt,
      createdAt: payment.createdAt,
    },
    timeline: order.statusLogs.map((l) => ({
      status: l.status,
      at: l.createdAt,
    })),
  };
}
