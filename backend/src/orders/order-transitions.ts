import { ConflictException } from '@nestjs/common';
import type { OrderStatus, Prisma } from '@prisma/client';
import { assertTransition } from './order-state-machine';

export interface OrderRef {
  id: number;
  status: OrderStatus;
  version: number;
}

/**
 * Chuyển trạng thái đơn hàng: kiểm tra state machine + optimistic locking
 * (version) + ghi log trạng thái. Phải gọi bên trong một transaction.
 */
export async function transitionOrder(
  db: Prisma.TransactionClient,
  order: OrderRef,
  to: OrderStatus,
): Promise<OrderRef> {
  assertTransition(order.status, to);

  const res = await db.order.updateMany({
    where: { id: order.id, version: order.version, status: order.status },
    data: { status: to, version: { increment: 1 } },
  });
  if (res.count !== 1) {
    throw new ConflictException(
      'Đơn hàng vừa được cập nhật ở nơi khác, vui lòng thử lại',
    );
  }
  await db.orderStatusLog.create({ data: { orderId: order.id, status: to } });

  return { id: order.id, status: to, version: order.version + 1 };
}
