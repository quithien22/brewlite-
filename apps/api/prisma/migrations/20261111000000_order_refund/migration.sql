-- Hủy đơn đã thanh toán + hoàn tiền (trong thời hạn cho phép)

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDING';
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
ALTER TYPE "LoyaltyType" ADD VALUE 'REVOKE';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "refundTransactionId" TEXT,
ADD COLUMN "refundedAt" TIMESTAMP(3);
