import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { PaymentMethod } from '@prisma/client';

export interface ChargeRequest {
  orderId: number;
  amount: number;
  method: PaymentMethod;
  /** Dùng để demo luồng "thanh toán thất bại". */
  simulateFailure?: boolean;
}

export interface ChargeResult {
  ok: boolean;
  provider: string;
  transactionId?: string;
  failureReason?: string;
}

export interface RefundRequest {
  orderId: number;
  amount: number;
  method: PaymentMethod;
  /** Mã giao dịch gốc cần hoàn. */
  transactionId?: string;
}

export interface RefundResult {
  ok: boolean;
  provider: string;
  transactionId?: string;
  failureReason?: string;
}

/** Cổng thanh toán giả lập (mô phỏng Momo/VNPay). */
@Injectable()
export class MockPaymentGateway {
  providerName(method: PaymentMethod): string {
    return method === 'WALLET' ? 'MoMo' : 'VNPay';
  }

  async charge(req: ChargeRequest): Promise<ChargeResult> {
    const provider = this.providerName(req.method);
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (req.simulateFailure) {
      return {
        ok: false,
        provider,
        failureReason: 'Giao dịch bị từ chối hoặc hết thời gian chờ',
      };
    }
    return {
      ok: true,
      provider,
      transactionId: `BL-${req.orderId}-${randomUUID()}`,
    };
  }

  /** Hoàn tiền về đúng phương thức đã thanh toán. Sau này thay bằng API hoàn tiền của cổng thật. */
  async refund(req: RefundRequest): Promise<RefundResult> {
    const provider = this.providerName(req.method);
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      ok: true,
      provider,
      transactionId: `RF-${req.orderId}-${randomUUID()}`,
    };
  }
}
