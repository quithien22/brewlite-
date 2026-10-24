import { BadRequestException, ConflictException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

type ProductDb = Pick<Prisma.TransactionClient, 'product'>;

/**
 * Giữ hàng khi đặt đơn (Task 10 – yêu cầu 3).
 *
 * Optimistic locking: đọc (stock, version) rồi cập nhật có điều kiện
 * `WHERE version = <đã đọc>`. Nếu có khách khác vừa mua, version đã đổi →
 * count = 0 → đọc lại và thử lại. Nhờ đó tồn kho không bao giờ âm.
 * Sản phẩm được xử lý theo thứ tự id tăng dần để tránh deadlock.
 */
export async function reserveStock(
  db: ProductDb,
  needs: Map<number, number>,
  maxRetries = 8,
): Promise<void> {
  const entries = [...needs.entries()].sort((a, b) => a[0] - b[0]);

  for (const [productId, qty] of entries) {
    let reserved = false;

    for (let attempt = 0; attempt < maxRetries && !reserved; attempt++) {
      const product = await db.product.findUnique({
        where: { id: productId },
        select: { name: true, stock: true, version: true },
      });
      if (!product) throw new BadRequestException('Sản phẩm không tồn tại');

      if (product.stock < qty) {
        throw new ConflictException(
          product.stock <= 0
            ? `"${product.name}" đã hết hàng`
            : `"${product.name}" chỉ còn ${product.stock} phần`,
        );
      }

      const res = await db.product.updateMany({
        where: { id: productId, version: product.version },
        data: { stock: { decrement: qty }, version: { increment: 1 } },
      });
      reserved = res.count === 1;
    }

    if (!reserved) {
      throw new ConflictException(
        'Nhiều khách đang đặt cùng lúc, vui lòng thử lại',
      );
    }
  }
}

/** Trả hàng về kho khi hủy đơn. */
export async function releaseStock(
  db: ProductDb,
  items: { productId: number; qty: number }[],
): Promise<void> {
  const needs = new Map<number, number>();
  for (const it of items) {
    needs.set(it.productId, (needs.get(it.productId) ?? 0) + it.qty);
  }
  for (const [productId, qty] of needs) {
    await db.product.updateMany({
      where: { id: productId },
      data: { stock: { increment: qty }, version: { increment: 1 } },
    });
  }
}
