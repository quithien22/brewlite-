import { BadRequestException, ConflictException } from '@nestjs/common';
import { releaseStock, reserveStock } from './inventory';

type Db = Parameters<typeof reserveStock>[0];

/**
 * CSDL giả lập 1 sản phẩm với cột `version` giống Prisma/PostgreSQL:
 * `updateMany({ where: { version } })` chỉ thành công nếu version chưa đổi.
 * Mỗi lệnh đọc/ghi nhường event loop để các request "đặt cùng lúc" xen kẽ nhau.
 */
function makeDb(initialStock: number) {
  const row = { name: 'Cà phê sữa', stock: initialStock, version: 0 };
  const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

  const db = {
    product: {
      findUnique: async () => {
        await tick();
        return { name: row.name, stock: row.stock, version: row.version };
      },
      updateMany: async (args: {
        where: { id: number; version?: number };
        data: {
          stock: { decrement?: number; increment?: number };
          version: { increment: number };
        };
      }) => {
        await tick();
        // Kiểm tra version + cập nhật là một bước nguyên tử (như 1 câu UPDATE)
        if (args.where.version !== undefined && args.where.version !== row.version) {
          return { count: 0 };
        }
        row.stock -= args.data.stock.decrement ?? 0;
        row.stock += args.data.stock.increment ?? 0;
        row.version += args.data.version.increment;
        return { count: 1 };
      },
    },
  };

  return { db: db as unknown as Db, row };
}

describe('Kiểm soát tồn kho khi đặt đồng thời (optimistic locking)', () => {
  it('10 khách cùng đặt 1 ly khi chỉ còn 5 → đúng 5 đơn thành công, tồn kho không âm', async () => {
    const { db, row } = makeDb(5);

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => reserveStock(db, new Map([[1, 1]]))),
    );

    const ok = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    expect(ok).toHaveLength(5);
    expect(failed).toHaveLength(5);
    expect(row.stock).toBe(0);
    for (const f of failed) {
      expect((f as PromiseRejectedResult).reason).toBeInstanceOf(
        ConflictException,
      );
    }
  });

  it('không bán quá số lượng còn lại khi mỗi đơn mua nhiều ly', async () => {
    const { db, row } = makeDb(5);

    const results = await Promise.allSettled([
      reserveStock(db, new Map([[1, 3]])),
      reserveStock(db, new Map([[1, 3]])),
      reserveStock(db, new Map([[1, 3]])),
    ]);

    // 5 ly chỉ đủ cho đúng 1 đơn 3 ly
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(row.stock).toBe(2);
    expect(row.stock).toBeGreaterThanOrEqual(0);
  });

  it('báo hết hàng và giữ nguyên tồn kho khi số lượng đặt vượt tồn', async () => {
    const { db, row } = makeDb(2);

    await expect(reserveStock(db, new Map([[1, 3]]))).rejects.toThrow(
      /chỉ còn 2 phần/,
    );
    expect(row.stock).toBe(2);
    expect(row.version).toBe(0);
  });

  it('báo "đã hết hàng" khi tồn kho bằng 0', async () => {
    const { db } = makeDb(0);
    await expect(reserveStock(db, new Map([[1, 1]]))).rejects.toThrow(
      /đã hết hàng/,
    );
  });

  it('tăng version sau mỗi lần giữ hàng thành công', async () => {
    const { db, row } = makeDb(10);
    await reserveStock(db, new Map([[1, 2]]));
    await reserveStock(db, new Map([[1, 3]]));
    expect(row.stock).toBe(5);
    expect(row.version).toBe(2);
  });

  it('trả hàng về kho khi hủy đơn', async () => {
    const { db, row } = makeDb(10);
    await reserveStock(db, new Map([[1, 4]]));
    expect(row.stock).toBe(6);

    await releaseStock(db, [
      { productId: 1, qty: 3 },
      { productId: 1, qty: 1 },
    ]);
    expect(row.stock).toBe(10);
  });

  it('từ chối (không phải lỗi hệ thống) khi sản phẩm không tồn tại', async () => {
    const db = {
      product: {
        findUnique: async () => null,
        updateMany: async () => ({ count: 0 }),
      },
    } as unknown as Db;
    await expect(reserveStock(db, new Map([[99, 1]]))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
