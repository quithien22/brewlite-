import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { POINT_VALUE, calcUnitPrice, earnedPoints } from '../common/pricing';
import { PrismaService } from '../prisma/prisma.service';
import { PromotionsService } from '../promotions/promotions.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQuery, UpdateOrderStatusDto } from './dto/order-query.dto';
import { releaseStock, reserveStock } from './inventory';
import { ORDER_INCLUDE, mapOrder } from './order.mapper';
import { canTransition } from './order-state-machine';
import { transitionOrder } from './order-transitions';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly promotions: PromotionsService,
  ) {}

  /**
   * POST /orders — tạo đơn PENDING.
   * Giá luôn được tính lại ở server (không tin giá từ client).
   * Toàn bộ trong 1 transaction: giữ hàng + dùng mã + trừ điểm + tạo đơn.
   */
  async create(userId: number, dto: CreateOrderDto) {
    const orderId = await this.prisma.$transaction(
      async (tx) => {
        const productIds = [...new Set(dto.items.map((i) => i.productId))];
        const products = await tx.product.findMany({
          where: { id: { in: productIds }, isActive: true },
        });
        if (products.length !== productIds.length) {
          throw new BadRequestException(
            'Có sản phẩm không tồn tại hoặc đã ngừng bán',
          );
        }

        const toppingIds = [
          ...new Set(dto.items.flatMap((i) => i.toppingIds ?? [])),
        ];
        const toppings = toppingIds.length
          ? await tx.topping.findMany({
              where: { id: { in: toppingIds }, isActive: true },
            })
          : [];
        if (toppings.length !== toppingIds.length) {
          throw new BadRequestException('Có topping không hợp lệ');
        }

        const productMap = new Map(products.map((p) => [p.id, p]));
        const toppingMap = new Map(toppings.map((t) => [t.id, t]));

        const needs = new Map<number, number>();
        const itemsData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] =
          [];
        let subtotal = 0;

        for (const item of dto.items) {
          const product = productMap.get(item.productId)!;
          const chosen = [...new Set(item.toppingIds ?? [])].map(
            (id) => toppingMap.get(id)!,
          );
          const unitPrice = calcUnitPrice(
            product.price,
            item.size,
            chosen.map((t) => t.price),
          );
          const lineTotal = unitPrice * item.qty;
          subtotal += lineTotal;
          needs.set(product.id, (needs.get(product.id) ?? 0) + item.qty);

          itemsData.push({
            productId: product.id,
            productName: product.name,
            imageUrl: product.imageUrl,
            size: item.size,
            sugar: item.sugar ?? '100%',
            ice: item.ice ?? 'Đá bình thường',
            toppings: chosen.map((t) => ({
              id: t.id,
              name: t.name,
              price: t.price,
            })) as Prisma.InputJsonValue,
            unitPrice,
            qty: item.qty,
            lineTotal,
          });
        }

        // Kiểm soát tồn kho (optimistic locking)
        await reserveStock(tx, needs);

        // Mã khuyến mãi
        let discount = 0;
        let couponCode: string | null = null;
        if (dto.couponCode?.trim()) {
          const ev = await this.promotions.evaluate(
            tx,
            dto.couponCode,
            subtotal,
          );
          await this.promotions.consume(tx, ev.promotion);
          discount = ev.discount;
          couponCode = ev.promotion.code;
        }

        // Dùng điểm thưởng
        const pointsUsed = dto.pointsToUse ?? 0;
        if (pointsUsed > 0) {
          const maxPoints = Math.floor((subtotal - discount) / POINT_VALUE);
          if (pointsUsed > maxPoints) {
            throw new BadRequestException(
              'Số điểm sử dụng vượt quá giá trị đơn hàng',
            );
          }
          const res = await tx.user.updateMany({
            where: { id: userId, loyaltyPoints: { gte: pointsUsed } },
            data: { loyaltyPoints: { decrement: pointsUsed } },
          });
          if (res.count !== 1) {
            throw new BadRequestException('Bạn không đủ điểm thưởng');
          }
        }

        const total = subtotal - discount - pointsUsed * POINT_VALUE;

        const order = await tx.order.create({
          data: {
            userId,
            subtotal,
            discount,
            pointsUsed,
            total,
            couponCode,
            note: dto.note?.trim() || null,
            pointsEarned: earnedPoints(total),
            items: { create: itemsData },
            statusLogs: { create: [{ status: 'PENDING' }] },
          },
          select: { id: true },
        });
        return order.id;
      },
      { timeout: 15000, maxWait: 10000 },
    );

    return this.findOneForUser(userId, orderId);
  }

  /** GET /orders/me — lịch sử đơn (lọc + phân trang) */
  async listForUser(userId: number, q: ListOrdersQuery) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 10;

    const where: Prisma.OrderWhereInput = { userId };
    if (q.status) where.status = q.status;
    if (q.month) {
      const [y, m] = q.month.split('-').map(Number);
      where.createdAt = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    }
    if (q.search?.trim()) {
      const id = Number(q.search.replace('#', '').trim());
      where.id = Number.isInteger(id) && id > 0 ? id : -1; // -1: không khớp đơn nào
    }

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: orders.map(mapOrder),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  /** GET /orders/:id */
  async findOneForUser(userId: number, id: number) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return mapOrder(order);
  }

  /**
   * POST /orders/:id/cancel — khách hủy đơn khi cửa hàng chưa pha chế.
   * Hoàn kho, hoàn mã, hoàn điểm; nếu đã thanh toán thì đánh dấu hoàn tiền.
   */
  async cancel(userId: number, id: number) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, userId },
        include: { items: true, payments: true },
      });
      if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

      if (!canTransition(order.status, 'CANCELLED')) {
        throw new BadRequestException(
          order.status === 'CANCELLED'
            ? 'Đơn hàng đã được hủy trước đó'
            : 'Đơn đang được pha chế nên không thể hủy',
        );
      }

      await transitionOrder(tx, order, 'CANCELLED');

      await releaseStock(tx, order.items);
      if (order.couponCode) {
        await this.promotions.release(tx, order.couponCode);
      }

      // Hoàn điểm đã dùng; thu hồi điểm đã cộng (nếu có)
      let pointsDelta = order.pointsUsed;
      if (order.pointsAwarded) pointsDelta -= order.pointsEarned;
      if (pointsDelta !== 0) {
        const user = await tx.user.findUniqueOrThrow({
          where: { id: userId },
          select: { loyaltyPoints: true },
        });
        await tx.user.update({
          where: { id: userId },
          data: { loyaltyPoints: Math.max(0, user.loyaltyPoints + pointsDelta) },
        });
      }

      await tx.payment.updateMany({
        where: { orderId: id, status: 'SUCCESS' },
        data: { status: 'REFUNDED' },
      });
    });

    return this.findOneForUser(userId, id);
  }

  /** PATCH /orders/:id/status — barista cập nhật tiến độ (STAFF) */
  async updateStatus(id: number, dto: UpdateOrderStatusDto) {
    const userId = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id } });
      if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
      await transitionOrder(tx, order, dto.status);
      return order.userId;
    });
    return this.findOneForUser(userId, id);
  }
}
