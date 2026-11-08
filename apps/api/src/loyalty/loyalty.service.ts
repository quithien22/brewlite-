import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import type { LoyaltyType, Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

/**
 * Sổ điểm thưởng (EARN / REDEEM / REFUND).
 * Mỗi đơn chỉ có tối đa một bút toán cho mỗi loại (unique orderId + type),
 * nên cộng điểm / hoàn điểm không bao giờ bị thực hiện hai lần.
 * Mọi hàm phải được gọi bên trong transaction của đơn / thanh toán.
 */
@Injectable()
export class LoyaltyService {
  private async exists(tx: Tx, orderId: number, type: LoyaltyType) {
    const row = await tx.loyaltyTransaction.findUnique({
      where: { orderId_type: { orderId, type } },
      select: { id: true },
    });
    return row !== null;
  }

  /** Trừ điểm khách dùng khi đặt đơn (REDEEM). Không đủ điểm → 422. */
  async redeem(tx: Tx, userId: number, orderId: number, points: number) {
    if (points <= 0) return;
    const res = await tx.user.updateMany({
      where: { id: userId, loyaltyPoints: { gte: points } },
      data: { loyaltyPoints: { decrement: points } },
    });
    if (res.count !== 1) {
      throw new UnprocessableEntityException('Bạn không đủ điểm thưởng');
    }
    await tx.loyaltyTransaction.create({
      data: { userId, orderId, type: 'REDEEM', points },
    });
  }

  /** Cộng điểm sau khi thanh toán thành công (EARN). Trả về true nếu thật sự đã cộng. */
  async earn(tx: Tx, userId: number, orderId: number, points: number) {
    if (points <= 0 || (await this.exists(tx, orderId, 'EARN'))) return false;
    await tx.loyaltyTransaction.create({
      data: { userId, orderId, type: 'EARN', points },
    });
    await tx.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { increment: points } },
    });
    return true;
  }

  /** Hoàn điểm đã dùng khi đơn bị hủy (REFUND). Hủy hai lần không hoàn hai lần. */
  async refund(tx: Tx, userId: number, orderId: number, points: number) {
    if (points <= 0 || (await this.exists(tx, orderId, 'REFUND'))) return false;
    await tx.loyaltyTransaction.create({
      data: { userId, orderId, type: 'REFUND', points },
    });
    await tx.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { increment: points } },
    });
    return true;
  }
}
