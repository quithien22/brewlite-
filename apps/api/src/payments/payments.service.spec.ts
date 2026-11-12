import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { PaymentsService } from './payments.service';

type AnyRecord = Record<string, any>;

/**
 * Prisma giả lập trong bộ nhớ, đủ cho PaymentsService:
 * - `Payment.idempotencyKey` có ràng buộc unique (ném P2002 như Prisma thật)
 * - `Order.updateMany({ where: { version } })` là khóa lạc quan
 * - `LoyaltyTransaction` để kiểm tra bút toán EARN chỉ ghi một lần
 */
function makeFakePrisma() {
  const order: AnyRecord = {
    id: 1,
    userId: 7,
    status: 'PENDING',
    total: 85000,
    version: 0,
    pointsEarned: 8,
    pointsAwarded: false,
  };
  const user = { id: 7, loyaltyPoints: 0 };
  const payments: AnyRecord[] = [];
  const logs: AnyRecord[] = [];
  const ledger: AnyRecord[] = [];
  const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

  const fake: AnyRecord = {
    payment: {
      findUnique: async ({ where }: AnyRecord) => {
        await tick();
        const p = where.idempotencyKey
          ? payments.find((x) => x.idempotencyKey === where.idempotencyKey)
          : payments.find((x) => x.id === where.id);
        return p ? { ...p, order: { ...order } } : null;
      },
      count: async ({ where }: AnyRecord) =>
        payments.filter(
          (p) =>
            p.orderId === where.orderId &&
            p.status === where.status &&
            (!where.createdAt?.gt || p.createdAt > where.createdAt.gt),
        ).length,
      findFirst: async ({ where }: AnyRecord) => {
        const found = [...payments]
          .reverse()
          .find(
            (p) =>
              (where.orderId === undefined || p.orderId === where.orderId) &&
              (where.status === undefined || p.status === where.status),
          );
        return found ? { ...found } : null;
      },
      updateMany: async ({ where, data }: AnyRecord) => {
        const selected = payments.filter(
          (p) =>
            (where.id === undefined || p.id === where.id) &&
            (where.orderId === undefined || p.orderId === where.orderId) &&
            (where.status === undefined || p.status === where.status) &&
            (!where.createdAt?.lte || p.createdAt <= where.createdAt.lte),
        );
        selected.forEach((payment) => Object.assign(payment, data));
        return { count: selected.length };
      },
      create: async ({ data }: AnyRecord) => {
        await tick();
        if (payments.some((p) => p.idempotencyKey === data.idempotencyKey)) {
          throw new Prisma.PrismaClientKnownRequestError('Unique constraint', {
            code: 'P2002',
            clientVersion: 'test',
          });
        }
        const row = { id: payments.length + 1, createdAt: new Date(), ...data };
        payments.push(row);
        return { ...row };
      },
      update: async ({ where, data }: AnyRecord) => {
        const p = payments.find((x) => x.id === where.id)!;
        Object.assign(p, data);
        return { ...p };
      },
    },
    order: {
      findFirst: async ({ where }: AnyRecord) =>
        where.id === order.id && where.userId === order.userId
          ? { ...order }
          : null,
      findUniqueOrThrow: async () => ({ ...order }),
      updateMany: async ({ where, data }: AnyRecord) => {
        if (where.id !== undefined && where.id !== order.id) return { count: 0 };
        if (where.version !== undefined && where.version !== order.version)
          return { count: 0 };
        if (where.status !== undefined && where.status !== order.status)
          return { count: 0 };
        if (
          where.pointsAwarded !== undefined &&
          where.pointsAwarded !== order.pointsAwarded
        )
          return { count: 0 };
        if (data.status) order.status = data.status;
        if (data.pointsAwarded !== undefined)
          order.pointsAwarded = data.pointsAwarded;
        if (data.version?.increment) order.version += data.version.increment;
        return { count: 1 };
      },
    },
    orderStatusLog: {
      create: async ({ data }: AnyRecord) => {
        const row = { id: logs.length + 1, createdAt: new Date(), ...data };
        logs.push(row);
        return row;
      },
      findFirst: async ({ where }: AnyRecord) =>
        [...logs]
          .reverse()
          .find((l) => l.orderId === where.orderId && l.status === where.status) ??
        null,
    },
    user: {
      findUnique: async () => ({ ...user }),
      update: async ({ data }: AnyRecord) => {
        if (data.loyaltyPoints.increment) {
          user.loyaltyPoints += data.loyaltyPoints.increment;
        }
        if (data.loyaltyPoints.decrement) {
          user.loyaltyPoints -= data.loyaltyPoints.decrement;
        }
        return user;
      },
    },
    loyaltyTransaction: {
      findUnique: async ({ where }: AnyRecord) =>
        ledger.find(
          (l) =>
            l.orderId === where.orderId_type.orderId &&
            l.type === where.orderId_type.type,
        ) ?? null,
      create: async ({ data }: AnyRecord) => {
        ledger.push(data);
        return data;
      },
    },
    $transaction: async (fn: (tx: AnyRecord) => Promise<unknown>) => fn(fake),
  };

  return { fake, order, user, payments, ledger, logs };
}

function makeService(
  opts: { gatewayOk?: boolean; gatewaySequence?: boolean[]; refundOk?: boolean } = {},
) {
  const { fake, order, user, payments, ledger, logs } = makeFakePrisma();
  let chargeIndex = 0;
  const charge = jest.fn(async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    const ok = opts.gatewaySequence?.[chargeIndex++] ?? opts.gatewayOk !== false;
    return !ok
      ? { ok: false, provider: 'MoMo', failureReason: 'Bị từ chối' }
      : { ok: true, provider: 'MoMo', transactionId: 'BL1MOMO' };
  });
  const refund = jest.fn(async (_req: unknown) =>
    opts.refundOk === false
      ? { ok: false, provider: 'MoMo', failureReason: 'Cổng từ chối hoàn tiền' }
      : { ok: true, provider: 'MoMo', transactionId: 'RF-TEST-1' },
  );
  const gateway = { providerName: () => 'MoMo', charge, refund };
  const orders = {
    findOneForUser: jest.fn(async (_userId: number, id: number) => ({
      id,
      status: order.status,
    })),
    // OrdersService.refundInTx thật sẽ chuyển REFUNDED + trả kho / mã / điểm đã dùng
    refundInTx: jest.fn(async () => {
      order.status = 'REFUNDED';
    }),
  };
  const service = new PaymentsService(
    fake as never,
    gateway as never,
    orders as never,
    new LoyaltyService(),
  );
  return { service, charge, refund, orders, order, user, payments, ledger, logs };
}

const DTO = { orderId: 1, method: 'WALLET' as const };

describe('Thanh toán idempotent (Idempotency-Key)', () => {
  it('gửi 2 lần cùng Idempotency-Key → chỉ gọi cổng thanh toán 1 lần, chỉ 1 giao dịch', async () => {
    const { service, charge, payments, order } = makeService();

    const first = await service.pay(7, 'key-abc-12345', DTO);
    const second = await service.pay(7, 'key-abc-12345', DTO);

    expect(first.success).toBe(true);
    expect(first.replayed).toBe(false);
    expect(second.success).toBe(true);
    expect(second.replayed).toBe(true);
    expect(second.payment.id).toBe(first.payment.id);

    expect(charge).toHaveBeenCalledTimes(1); // không trừ tiền 2 lần
    expect(payments).toHaveLength(1);
    expect(order.status).toBe('PAID');
  });

  it('gửi lặp nhiều lần (3 lần) vẫn chỉ cộng điểm đúng 1 lần và chỉ 1 bút toán EARN', async () => {
    const { service, user, ledger } = makeService();

    await service.pay(7, 'key-abc-12345', DTO);
    await service.pay(7, 'key-abc-12345', DTO);
    await service.pay(7, 'key-abc-12345', DTO);

    expect(user.loyaltyPoints).toBe(8);
    expect(ledger.filter((l) => l.type === 'EARN')).toHaveLength(1);
  });

  it('2 request song song cùng key → vẫn chỉ 1 lần trừ tiền', async () => {
    const { service, charge, payments } = makeService();

    const results = await Promise.allSettled([
      service.pay(7, 'key-parallel-1', DTO),
      service.pay(7, 'key-parallel-1', DTO),
    ]);

    expect(results.some((r) => r.status === 'fulfilled')).toBe(true);
    expect(charge).toHaveBeenCalledTimes(1);
    expect(payments).toHaveLength(1);
  });

  it('đơn đã PAID thì không thanh toán lại bằng key khác', async () => {
    const { service, charge } = makeService();

    await service.pay(7, 'key-abc-12345', DTO);
    await expect(service.pay(7, 'key-other-9999', DTO)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(charge).toHaveBeenCalledTimes(1);
  });

  it('dùng lại key cho đơn/người khác → bị từ chối (422)', async () => {
    const { service } = makeService();

    await service.pay(7, 'key-abc-12345', DTO);
    await expect(service.pay(99, 'key-abc-12345', DTO)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('thanh toán lỗi → đơn PAYMENT_FAILED, không cộng điểm; thử lại với key mới thì được', async () => {
    const failing = makeService({ gatewayOk: false });
    const failed = await failing.service.pay(7, 'key-fail-0001', DTO);

    expect(failed.success).toBe(false);
    expect(failing.order.status).toBe('PAYMENT_FAILED');
    expect(failing.user.loyaltyPoints).toBe(0);
    expect(failing.ledger).toHaveLength(0);

    // Gửi lại đúng key cũ → trả kết quả thất bại cũ, không gọi cổng lần nữa
    const replay = await failing.service.pay(7, 'key-fail-0001', DTO);
    expect(replay.replayed).toBe(true);
    expect(replay.success).toBe(false);
    expect(failing.charge).toHaveBeenCalledTimes(1);

    // Khách chủ động thử lại (key mới) → đơn quay về PENDING rồi gọi cổng lại
    await failing.service.pay(7, 'key-retry-0002', DTO);
    expect(failing.charge).toHaveBeenCalledTimes(2);
  });
});

describe('Bảo vệ thanh toán giả lập', () => {
  it('một Idempotency-Key không thể thay đổi phương thức thanh toán', async () => {
    const { service, charge } = makeService();
    await service.pay(7, 'key-abc-12345', DTO);
    await expect(
      service.pay(7, 'key-abc-12345', { ...DTO, method: 'CARD' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(charge).toHaveBeenCalledTimes(1);
  });

  it('lỗi rồi thanh toán lại bằng key mới: chỉ cộng điểm một lần', async () => {
    const { service, user, payments, order } = makeService({
      gatewaySequence: [false, true],
    });
    const first = await service.pay(7, 'key-fail-0001', DTO);
    expect(first.success).toBe(false);
    expect(order.status).toBe('PAYMENT_FAILED');
    expect(user.loyaltyPoints).toBe(0);

    const next = await service.pay(7, 'key-retry-0002', DTO);
    expect(next.success).toBe(true);
    expect(order.status).toBe('PAID');
    expect(user.loyaltyPoints).toBe(8);
    expect(payments).toHaveLength(2);
  });

  it('giao dịch PROCESSING quá 2 phút bị đánh dấu FAILED, không chặn thanh toán mới', async () => {
    const { service, payments, order } = makeService();
    payments.push({
      id: 123,
      orderId: 1,
      idempotencyKey: 'old-transaction-key',
      amount: 85000,
      method: 'WALLET',
      provider: 'MoMo',
      status: 'PROCESSING',
      createdAt: new Date(Date.now() - 5 * 60_000),
    });

    await service.pay(7, 'key-new-0001', DTO);
    expect(payments[0].status).toBe('FAILED');
    expect(order.status).toBe('PAID');
    expect(payments[1].status).toBe('SUCCESS');
  });

  it('đơn đang có giao dịch PROCESSING (< 2 phút) thì yêu cầu mới với key khác bị 409', async () => {
    const { service, payments, charge } = makeService();
    payments.push({
      id: 50,
      orderId: 1,
      idempotencyKey: 'in-flight-key-1',
      amount: 85000,
      method: 'WALLET',
      provider: 'MoMo',
      status: 'PROCESSING',
      createdAt: new Date(),
    });

    await expect(service.pay(7, 'key-other-0002', DTO)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(charge).not.toHaveBeenCalled();
  });

  it('gửi lại cùng key khi giao dịch còn PROCESSING → 409 "đang được xử lý"', async () => {
    const { service, payments, charge } = makeService();
    payments.push({
      id: 50,
      orderId: 1,
      idempotencyKey: 'in-flight-key-1',
      amount: 85000,
      method: 'WALLET',
      provider: 'MoMo',
      status: 'PROCESSING',
      createdAt: new Date(),
    });

    await expect(service.pay(7, 'in-flight-key-1', DTO)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(charge).not.toHaveBeenCalled();
  });
});

describe('Hủy đơn đã thanh toán + hoàn tiền', () => {
  it('hoàn tiền trong thời hạn → đơn REFUNDED, gọi cổng đúng 1 lần, thu hồi điểm đã cộng', async () => {
    const { service, refund, orders, order, payments, user, ledger } = makeService();
    await service.pay(7, 'key-abc-12345', DTO);
    expect(user.loyaltyPoints).toBe(8);

    const res = await service.refund(7, 1);

    expect(res.refunded).toBe(true);
    expect(refund).toHaveBeenCalledTimes(1);
    expect(refund).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 1, amount: 85000 }),
    );
    expect(orders.refundInTx).toHaveBeenCalledTimes(1);
    expect(order.status).toBe('REFUNDED');
    expect(payments[0].status).toBe('REFUNDED');
    expect(payments[0].refundTransactionId).toBe('RF-TEST-1');
    expect(user.loyaltyPoints).toBe(0);
    expect(ledger.filter((l) => l.type === 'REVOKE')).toHaveLength(1);
  });

  it('bấm hoàn tiền hai lần → lần hai bị từ chối, chỉ gọi cổng 1 lần', async () => {
    const { service, refund } = makeService();
    await service.pay(7, 'key-abc-12345', DTO);
    await service.refund(7, 1);

    await expect(service.refund(7, 1)).rejects.toBeInstanceOf(BadRequestException);
    expect(refund).toHaveBeenCalledTimes(1);
  });

  it('2 request hoàn tiền song song → chỉ 1 request được gọi cổng', async () => {
    const { service, refund, ledger } = makeService();
    await service.pay(7, 'key-abc-12345', DTO);

    const results = await Promise.allSettled([
      service.refund(7, 1),
      service.refund(7, 1),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(refund).toHaveBeenCalledTimes(1);
    expect(ledger.filter((l) => l.type === 'REVOKE')).toHaveLength(1);
  });

  it('quá thời hạn hoàn tiền → 422, không gọi cổng, đơn vẫn PAID', async () => {
    const { service, refund, order, logs, payments } = makeService();
    await service.pay(7, 'key-abc-12345', DTO);
    logs.find((l) => l.status === 'PAID')!.createdAt = new Date(
      Date.now() - 10 * 60_000,
    );

    await expect(service.refund(7, 1)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(refund).not.toHaveBeenCalled();
    expect(order.status).toBe('PAID');
    expect(payments[0].status).toBe('SUCCESS');
  });

  it('khách đã dùng hết điểm của đơn này → 422, không gọi cổng', async () => {
    const { service, refund, user, order } = makeService();
    await service.pay(7, 'key-abc-12345', DTO);
    user.loyaltyPoints = 3; // đã tiêu bớt điểm, còn ít hơn 8 điểm đã cộng

    await expect(service.refund(7, 1)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(refund).not.toHaveBeenCalled();
    expect(order.status).toBe('PAID');
    expect(user.loyaltyPoints).toBe(3);
  });

  it('cổng hoàn tiền lỗi → 502, đơn vẫn PAID, giao dịch về SUCCESS để thử lại', async () => {
    const { service, orders, order, payments, user } = makeService({
      refundOk: false,
    });
    await service.pay(7, 'key-abc-12345', DTO);

    await expect(service.refund(7, 1)).rejects.toBeInstanceOf(BadGatewayException);
    expect(orders.refundInTx).not.toHaveBeenCalled();
    expect(order.status).toBe('PAID');
    expect(payments[0].status).toBe('SUCCESS');
    expect(user.loyaltyPoints).toBe(8); // chưa thu hồi điểm
  });

  it('đơn chưa thanh toán thì không hoàn tiền (409)', async () => {
    const { service, refund } = makeService();

    await expect(service.refund(7, 1)).rejects.toBeInstanceOf(ConflictException);
    expect(refund).not.toHaveBeenCalled();
  });

  it('không hoàn tiền đơn của người khác (404)', async () => {
    const { service, refund } = makeService();
    await service.pay(7, 'key-abc-12345', DTO);

    await expect(service.refund(99, 1)).rejects.toBeInstanceOf(NotFoundException);
    expect(refund).not.toHaveBeenCalled();
  });
});
