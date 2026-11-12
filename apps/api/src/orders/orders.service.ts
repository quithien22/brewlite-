import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PAYMENT_PROCESSING_TTL_MS } from '../common/constants';
import { POINT_VALUE, calcUnitPrice, earnedPoints } from '../common/pricing';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { PrismaService } from '../prisma/prisma.service';
import { PromotionsService } from '../promotions/promotions.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQuery } from './dto/order-query.dto';
import { releaseStock, reserveStock } from './inventory';
import { ORDER_INCLUDE, mapOrder } from './order.mapper';
import { CANCELLABLE_STATUSES } from './order-state-machine';
import { transitionOrder } from './order-transitions';

/** Đơn kèm các trường cần để hủy / hoàn tài nguyên. */
interface CancellableOrder {
  id: number;
  userId: number;
  status: 'PENDING' | 'PAID' | 'PAYMENT_FAILED' | 'CANCELLED' | 'REFUNDED';
  version: number;
  couponCode: string | null;
  pointsUsed: number;
  items: { productId: number; qty: number }[];
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly promotions: PromotionsService,
    private readonly loyalty: LoyaltyService,
  ) {}

  /**
   * POST /orders — tạo đơn PENDING (FR-16, FR-17).
   * Giá luôn được tính lại ở server (không tin giá từ client).
   * Toàn bộ trong 1 transaction: giữ hàng + dùng mã + trừ điểm + tạo đơn + nhật ký trạng thái.
   * Lỗi ở bất kỳ bước nào → ROLLBACK toàn bộ.
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

          // Snapshot: đơn cũ không đổi khi sản phẩm bị sửa hoặc ẩn
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

        // Kiểm tra và giữ tồn kho (409 nếu thiếu hàng)
        await reserveStock(tx, needs);

        // Mã khuyến mãi: kiểm tra lại + tăng lượt dùng. Hết hạn / hết lượt tại thời điểm đặt → 422 (E4)
        let discount = 0;
        let couponCode: string | null = null;
        if (dto.couponCode?.trim()) {
          try {
            const ev = await this.promotions.evaluate(
              tx,
              dto.couponCode,
              subtotal,
            );
            await this.promotions.consume(tx, ev.promotion);
            discount = ev.discount;
            couponCode = ev.promotion.code;
          } catch (e) {
            if (e instanceof BadRequestException) {
              throw new UnprocessableEntityException(e.message);
            }
            throw e;
          }
        }

        // Điểm thưởng: không vượt giá trị đơn sau giảm (AC-14.2)
        const pointsUsed = dto.pointsToUse ?? 0;
        if (pointsUsed > Math.floor((subtotal - discount) / POINT_VALUE)) {
          throw new UnprocessableEntityException(
            'Số điểm sử dụng vượt quá giá trị đơn hàng',
          );
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

        // Trừ điểm + ghi bút toán REDEEM (không đủ điểm → 422, ROLLBACK cả đơn)
        await this.loyalty.redeem(tx, userId, order.id, pointsUsed);

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

  /** GET /orders/:id — đơn của người khác hoặc không tồn tại đều trả 404 (không lộ sự tồn tại) */
  async findOneForUser(userId: number, id: number) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return mapOrder(order);
  }

  /** Đơn đang có giao dịch PROCESSING còn hạn thì không được hủy. */
  private async hasLiveProcessingPayment(
    tx: Prisma.TransactionClient,
    orderId: number,
  ) {
    const n = await tx.payment.count({
      where: {
        orderId,
        status: 'PROCESSING',
        createdAt: { gt: new Date(Date.now() - PAYMENT_PROCESSING_TTL_MS) },
      },
    });
    return n > 0;
  }

  /** Chuyển CANCELLED + hoàn tồn kho, hoàn lượt mã, hoàn điểm đã dùng (REFUND). */
  private async cancelInTx(
    tx: Prisma.TransactionClient,
    order: CancellableOrder,
  ) {
    await transitionOrder(tx, order, 'CANCELLED');
    await releaseStock(tx, order.items);
    if (order.couponCode) {
      await this.promotions.release(tx, order.couponCode);
    }
    await this.loyalty.refund(tx, order.userId, order.id, order.pointsUsed);
  }

  /**
   * Hoàn tiền xong (gọi từ PaymentsService trong transaction): chuyển REFUNDED +
   * hoàn tồn kho, lượt mã, điểm khách đã dùng. Việc thu hồi điểm đã cộng do PaymentsService làm.
   */
  async refundInTx(tx: Prisma.TransactionClient, orderId: number) {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });
    await transitionOrder(tx, order, 'REFUNDED');
    await releaseStock(tx, order.items);
    if (order.couponCode) {
      await this.promotions.release(tx, order.couponCode);
    }
    await this.loyalty.refund(tx, order.userId, order.id, order.pointsUsed);
  }

  /**
   * POST /orders/:id/cancel — khách hủy đơn chưa thanh toán (FR-26).
   * Chỉ PENDING / PAYMENT_FAILED. Đơn PAID phải dùng POST /payments/refund (hủy + hoàn tiền).
   */
  async cancel(userId: number, id: number) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, userId },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

      if (order.status === 'PAID') {
        throw new BadRequestException(
          'Đơn đã thanh toán, hãy dùng "Hủy và hoàn tiền" trong thời hạn cho phép',
        );
      }
      if (order.status === 'REFUNDED') {
        throw new BadRequestException('Đơn hàng đã được hoàn tiền trước đó');
      }
      if (order.status === 'CANCELLED') {
        throw new BadRequestException('Đơn hàng đã được hủy trước đó');
      }
      if (!CANCELLABLE_STATUSES.includes(order.status)) {
        throw new BadRequestException('Đơn hàng không thể hủy ở trạng thái này');
      }
      if (await this.hasLiveProcessingPayment(tx, id)) {
        throw new ConflictException(
          'Đơn hàng đang được xử lý thanh toán, vui lòng thử lại sau',
        );
      }

      await this.cancelInTx(tx, order);
    });

    return this.findOneForUser(userId, id);
  }

  /**
   * FR-27: tự hủy đơn PENDING / PAYMENT_FAILED quá `minutes` phút.
   * Bỏ qua đơn đang có giao dịch PROCESSING. Trả về số đơn đã hủy.
   */
  async expireStale(minutes: number, now = new Date()): Promise<number> {
    const cutoff = new Date(now.getTime() - minutes * 60_000);
    const candidates = await this.prisma.order.findMany({
      where: {
        status: { in: ['PENDING', 'PAYMENT_FAILED'] },
        createdAt: { lt: cutoff },
      },
      select: { id: true },
      take: 100,
    });

    let cancelled = 0;
    for (const { id } of candidates) {
      try {
        const done = await this.prisma.$transaction(async (tx) => {
          const order = await tx.order.findUnique({
            where: { id },
            include: { items: true },
          });
          if (!order || !CANCELLABLE_STATUSES.includes(order.status)) return false;
          if (await this.hasLiveProcessingPayment(tx, id)) return false;
          await this.cancelInTx(tx, order);
          return true;
        });
        if (done) cancelled++;
      } catch {
        // Đơn vừa được cập nhật ở nơi khác (khách thanh toán / hủy): thử lại ở lượt sau
      }
    }
    return cancelled;
  }
}
