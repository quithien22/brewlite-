import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaymentsService } from './payments.service';

type AnyRecord = Record<string, any>;

/**
 * Prisma giả lập trong bộ nhớ, đủ cho PaymentsService:
 * - `Payment.idempotencyKey` có ràng buộc unique (ném P2002 như Prisma thật)
 * - `Order.updateMany({ where: { version } })` là khóa lạc quan
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
          (p) => p.orderId === where.orderId && p.status === where.status &&
            (!where.createdAt?.gt || p.createdAt > where.createdAt.gt),
        ).length,
      updateMany: async ({ where, data }: AnyRecord) => {
        const selected = payments.filter((p) =>
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
        logs.push(data);
        return data;
      },
    },
    user: {
      update: async ({ data }: AnyRecord) => {
        user.loyaltyPoints += data.loyaltyPoints.increment;
        return user;
      },
    },
    $transaction: async (fn: (tx: AnyRecord) => Promise<unknown>) => fn(fake),
  };

  return { fake, order, user, payments };
}

function makeService(opts: { gatewayOk?: boolean; gatewaySequence?: boolean[] } = {}) {
  const { fake, order, user, payments } = makeFakePrisma();
  let chargeIndex = 0;
  const charge = jest.fn(async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    const ok = opts.gatewaySequence?.[chargeIndex++] ?? (opts.gatewayOk !== false);
    return !ok
      ? { ok: false, provider: 'MoMo', failureReason: 'Bị từ chối' }
      : { ok: true, provider: 'MoMo', transactionId: 'BL1MOMO' };
  });
  const gateway = { providerName: () => 'MoMo', charge };
  const orders = {
    findOneForUser: jest.fn(async (_userId: number, id: number) => ({
      id,
      status: order.status,
    })),
  };
  const service = new PaymentsService(fake as never, gateway as never, orders as never);
  return { service, charge, order, user, payments };
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

  it('gửi lặp nhiều lần (3 lần) vẫn chỉ cộng điểm thưởng đúng 1 lần', async () => {
    const { service, user } = makeService();

    await service.pay(7, 'key-abc-12345', DTO);
    await service.pay(7, 'key-abc-12345', DTO);
    await service.pay(7, 'key-abc-12345', DTO);

    expect(user.loyaltyPoints).toBe(8);
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
    const { service, user, payments, order } = makeService({ gatewaySequence: [false, true] });
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

  it('giao dịch PENDING quá hạn không được dùng kết quả đến muộn', async () => {
    const { service, payments, order } = makeService();
    payments.push({
      id: 123, orderId: 1, idempotencyKey: 'old-transaction-key',
      amount: 85000, method: 'WALLET', provider: 'MoMo',
      status: 'PENDING', createdAt: new Date(Date.now() - 5 * 60_000),
    });

    await service.pay(7, 'key-new-0001', DTO);
    expect(payments[0].status).toBe('FAILED');
    expect(order.status).toBe('PAID');
    expect(payments[1].status).toBe('SUCCESS');
  });
});
