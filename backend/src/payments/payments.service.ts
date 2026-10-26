import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrdersService } from '../orders/orders.service';
import { transitionOrder } from '../orders/order-transitions';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MockPaymentGateway } from './mock-payment.gateway';

/** Giao dịch PENDING quá lâu (server chết giữa chừng) sẽ không còn chặn đơn. */
const PENDING_TTL_MS = 2 * 60 * 1000;

function isUniqueViolation(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
  );
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: MockPaymentGateway,
    private readonly orders: OrdersService,
  ) {}

  /**
   * POST /payments — thanh toán idempotent (Task 10 – yêu cầu 2).
   *
   * 1. Cùng Idempotency-Key gửi lại → trả đúng kết quả cũ, KHÔNG gọi cổng
   *    thanh toán lần nữa (không trừ tiền 2 lần).
   * 2. Key được "giữ chỗ" trước bằng bản ghi Payment(PENDING) có ràng buộc
   *    unique → 2 request song song cùng key chỉ 1 request thắng.
   * 3. Đơn đang có giao dịch PENDING hoặc đã PAID thì không thanh toán tiếp.
   */
  async pay(userId: number, idempotencyKey: string, dto: CreatePaymentDto) {
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
      include: { order: true },
    });
    if (existing) return this.replay(userId, dto, existing);

    // ---- Bước 1: giữ chỗ key + mở lại đơn nếu đang PAYMENT_FAILED ----
    let paymentId: number;
    let amount: number;
    try {
      const claimed = await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
          where: { id: dto.orderId, userId },
        });
        if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
        if (order.status !== 'PENDING' && order.status !== 'PAYMENT_FAILED') {
          throw new ConflictException(
            'Đơn hàng không ở trạng thái chờ thanh toán',
          );
        }

        // Giao dịch demo bị treo sau khi backend bị tắt: đánh dấu FAILED.
        // Kết quả trả về muộn sẽ không được phép cập nhật đơn nữa.
        await tx.payment.updateMany({
          where: {
            orderId: order.id,
            status: 'PENDING',
            createdAt: { lte: new Date(Date.now() - PENDING_TTL_MS) },
          },
          data: {
            status: 'FAILED',
            failureReason: 'Giao dịch demo đã quá thời gian chờ',
          },
        });

        const inflight = await tx.payment.count({
          where: {
            orderId: order.id,
            status: 'PENDING',
            createdAt: { gt: new Date(Date.now() - PENDING_TTL_MS) },
          },
        });
        if (inflight > 0) {
          throw new ConflictException('Đơn hàng đang được xử lý thanh toán');
        }

        // Khóa lạc quan: chỉ 1 request cùng lúc qua được bước này
        const locked = await tx.order.updateMany({
          where: { id: order.id, version: order.version },
          data: { version: { increment: 1 } },
        });
        if (locked.count !== 1) {
          throw new ConflictException(
            'Đơn hàng vừa được cập nhật, vui lòng thử lại',
          );
        }
        if (order.status === 'PAYMENT_FAILED') {
          await transitionOrder(
            tx,
            { id: order.id, status: order.status, version: order.version + 1 },
            'PENDING',
          );
        }

        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            idempotencyKey,
            amount: order.total,
            method: dto.method,
            provider: this.gateway.providerName(dto.method),
            status: 'PENDING',
          },
        });
        return { id: payment.id, amount: order.total };
      });
      paymentId = claimed.id;
      amount = claimed.amount;
    } catch (e) {
      if (isUniqueViolation(e)) {
        // Request song song cùng key vừa giữ chỗ trước
        const dup = await this.prisma.payment.findUnique({
          where: { idempotencyKey },
          include: { order: true },
        });
        if (dup) return this.replay(userId, dto, dup);
      }
      throw e;
    }

    // ---- Bước 2: gọi cổng thanh toán (ngoài transaction) ----
    let result: Awaited<ReturnType<MockPaymentGateway['charge']>>;
    try {
      result = await this.gateway.charge({
        orderId: dto.orderId,
        amount,
        method: dto.method,
        simulateFailure: dto.simulateFailure,
      });
    } catch {
      result = {
        ok: false,
        provider: this.gateway.providerName(dto.method),
        failureReason: 'Cổng thanh toán không phản hồi',
      };
    }

    // ---- Bước 3: lưu kết quả atomically + kiểm tra tình trạng payment ----
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
      });
      // Đã hết hạn/được xử lý bởi tiến trình khác. Không ghi đè giao dịch cũ.
      if (!payment || payment.status !== 'PENDING') return;

      const order = await tx.order.findUniqueOrThrow({
        where: { id: dto.orderId },
      });

      if (order.status !== 'PENDING') {
        // Đây chỉ là mock, trạng thái REFUNDED KHÔNG đồng nghĩa đã hoàn tiền thật.
        await tx.payment.updateMany({
          where: { id: paymentId, status: 'PENDING' },
          data: {
            status: result.ok && order.status === 'CANCELLED' ? 'REFUNDED' : 'FAILED',
            provider: result.provider,
            transactionId: result.transactionId,
            failureReason: result.ok
              ? 'Đơn đã thay đổi trạng thái khi xử lý thanh toán mock'
              : result.failureReason,
          },
        });
        return;
      }

      const saved = await tx.payment.updateMany({
        where: { id: paymentId, status: 'PENDING' },
        data: {
          status: result.ok ? 'SUCCESS' : 'FAILED',
          provider: result.provider,
          transactionId: result.transactionId,
          failureReason: result.failureReason,
        },
      });
      if (saved.count !== 1) return;
      await transitionOrder(tx, order, result.ok ? 'PAID' : 'PAYMENT_FAILED');

      if (result.ok) {
        // Cộng điểm đúng 1 lần, bên trong cùng transaction.
        const flag = await tx.order.updateMany({
          where: { id: order.id, pointsAwarded: false },
          data: { pointsAwarded: true },
        });
        if (flag.count === 1 && order.pointsEarned > 0) {
          await tx.user.update({
            where: { id: userId },
            data: { loyaltyPoints: { increment: order.pointsEarned } },
          });
        }
      }
    });

    return this.buildResponse(userId, paymentId, false);
  }

  private async replay(
    userId: number,
    dto: CreatePaymentDto,
    existing: {
      id: number;
      orderId: number;
      method: string;
      status: string;
      order: { userId: number };
    },
  ) {
    if (
      existing.order.userId !== userId ||
      existing.orderId !== dto.orderId ||
      existing.method !== dto.method
    ) {
      throw new UnprocessableEntityException(
        'Idempotency-Key đã được dùng cho một yêu cầu thanh toán khác',
      );
    }
    if (existing.status === 'PENDING') {
      throw new ConflictException('Giao dịch đang được xử lý, vui lòng đợi');
    }
    return this.buildResponse(userId, existing.id, true);
  }

  private async buildResponse(
    userId: number,
    paymentId: number,
    replayed: boolean,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException('Không tìm thấy giao dịch');
    const order = await this.orders.findOneForUser(userId, payment.orderId);

    return {
      success: payment.status === 'SUCCESS',
      replayed,
      payment: {
        id: payment.id,
        method: payment.method,
        provider: payment.provider,
        status: payment.status,
        amount: payment.amount,
        transactionId: payment.transactionId,
        failureReason: payment.failureReason,
        createdAt: payment.createdAt,
      },
      order,
    };
  }
}
