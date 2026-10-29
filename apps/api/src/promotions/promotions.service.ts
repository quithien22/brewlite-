import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma, Promotion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const vnd = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

export interface PromotionEvaluation {
  promotion: Promotion;
  discount: number;
}

export function calcDiscount(promotion: Promotion, subtotal: number): number {
  if (promotion.type === 'PERCENT') {
    const raw = Math.floor((subtotal * promotion.value) / 100);
    return Math.min(raw, promotion.maxDiscount ?? raw, subtotal);
  }
  return Math.min(promotion.value, subtotal);
}

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /promotions — các khuyến mãi đang chạy */
  async listActive(now = new Date()) {
    const promos = await this.prisma.promotion.findMany({
      where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { id: 'asc' },
    });
    return promos
      .filter((p) => p.usageLimit === null || p.usedCount < p.usageLimit)
      .map((p) => ({
        code: p.code,
        title: p.title,
        description: p.description,
        type: p.type,
        value: p.value,
        minOrder: p.minOrder,
        maxDiscount: p.maxDiscount,
        endsAt: p.endsAt,
      }));
  }

  /** Kiểm tra mã & tính số tiền giảm. Ném BadRequest với lý do cụ thể nếu không hợp lệ. */
  async evaluate(
    db: Prisma.TransactionClient,
    rawCode: string,
    subtotal: number,
    now = new Date(),
  ): Promise<PromotionEvaluation> {
    const code = rawCode.trim().toUpperCase();
    const promotion = await db.promotion.findUnique({ where: { code } });

    if (!promotion || !promotion.isActive || promotion.startsAt > now) {
      throw new BadRequestException('Mã giảm giá không hợp lệ');
    }
    if (promotion.endsAt < now) {
      throw new BadRequestException('Mã giảm giá đã hết hạn');
    }
    if (
      promotion.usageLimit !== null &&
      promotion.usedCount >= promotion.usageLimit
    ) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    }
    if (subtotal < promotion.minOrder) {
      throw new BadRequestException(
        `Đơn tối thiểu ${vnd(promotion.minOrder)} để dùng mã ${promotion.code}`,
      );
    }
    return { promotion, discount: calcDiscount(promotion, subtotal) };
  }

  /** POST /promotions/validate — dùng cho ô "Mã giảm giá" ở giỏ hàng */
  async validate(code: string, subtotal: number) {
    try {
      const { promotion, discount } = await this.evaluate(
        this.prisma,
        code,
        subtotal,
      );
      return {
        valid: true,
        code: promotion.code,
        title: promotion.title,
        discount,
        message: `Đã áp dụng ${promotion.code} · Bạn tiết kiệm ${vnd(discount)}`,
      };
    } catch (e) {
      if (e instanceof BadRequestException) {
        return {
          valid: false,
          code: code.trim().toUpperCase(),
          discount: 0,
          message: e.message,
        };
      }
      throw e;
    }
  }

  /** Tăng lượt dùng (nguyên tử, không vượt usageLimit). Gọi trong transaction tạo đơn. */
  async consume(db: Prisma.TransactionClient, promotion: Promotion) {
    const res = await db.promotion.updateMany({
      where:
        promotion.usageLimit === null
          ? { id: promotion.id }
          : { id: promotion.id, usedCount: { lt: promotion.usageLimit } },
      data: { usedCount: { increment: 1 } },
    });
    if (res.count !== 1) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    }
  }

  async release(db: Prisma.TransactionClient, code: string) {
    await db.promotion.updateMany({
      where: { code, usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
  }
}
