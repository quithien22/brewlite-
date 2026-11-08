import { UnprocessableEntityException } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';

type AnyRecord = Record<string, any>;

function makeTx(initialPoints: number) {
  const user = { id: 7, loyaltyPoints: initialPoints };
  const ledger: AnyRecord[] = [];
  const tx: AnyRecord = {
    user: {
      updateMany: async ({ where, data }: AnyRecord) => {
        if (where.id !== user.id) return { count: 0 };
        if (where.loyaltyPoints?.gte > user.loyaltyPoints) return { count: 0 };
        user.loyaltyPoints -= data.loyaltyPoints.decrement;
        return { count: 1 };
      },
      update: async ({ data }: AnyRecord) => {
        user.loyaltyPoints += data.loyaltyPoints.increment;
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
  };
  return { tx: tx as never, user, ledger };
}

describe('Sổ điểm thưởng (LoyaltyService)', () => {
  const service = new LoyaltyService();

  it('EARN: cộng điểm đúng một lần cho mỗi đơn', async () => {
    const { tx, user, ledger } = makeTx(0);
    expect(await service.earn(tx, 7, 1, 8)).toBe(true);
    expect(await service.earn(tx, 7, 1, 8)).toBe(false);
    expect(user.loyaltyPoints).toBe(8);
    expect(ledger.filter((l) => l.type === 'EARN')).toHaveLength(1);
  });

  it('EARN: không ghi bút toán khi điểm bằng 0', async () => {
    const { tx, user, ledger } = makeTx(0);
    expect(await service.earn(tx, 7, 1, 0)).toBe(false);
    expect(user.loyaltyPoints).toBe(0);
    expect(ledger).toHaveLength(0);
  });

  it('REDEEM: trừ điểm và ghi bút toán', async () => {
    const { tx, user, ledger } = makeTx(120);
    await service.redeem(tx, 7, 1, 20);
    expect(user.loyaltyPoints).toBe(100);
    expect(ledger).toEqual([{ userId: 7, orderId: 1, type: 'REDEEM', points: 20 }]);
  });

  it('REDEEM: dùng nhiều điểm hơn số đang có → 422, không đổi số dư', async () => {
    const { tx, user, ledger } = makeTx(10);
    await expect(service.redeem(tx, 7, 1, 20)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(user.loyaltyPoints).toBe(10);
    expect(ledger).toHaveLength(0);
  });

  it('REFUND: hoàn điểm đã dùng đúng một lần dù hủy hai lần', async () => {
    const { tx, user } = makeTx(100);
    await service.redeem(tx, 7, 1, 20);
    expect(await service.refund(tx, 7, 1, 20)).toBe(true);
    expect(await service.refund(tx, 7, 1, 20)).toBe(false);
    expect(user.loyaltyPoints).toBe(100);
  });
});
