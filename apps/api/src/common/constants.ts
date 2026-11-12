/** Giao dịch PROCESSING quá thời hạn này được xem là thất bại (cổng không phản hồi). */
export const PAYMENT_PROCESSING_TTL_MS = 2 * 60 * 1000;

/** Đơn chưa thanh toán quá số phút này sẽ tự hủy (FR-27). Có thể đổi bằng ORDER_EXPIRE_MINUTES. */
export const ORDER_EXPIRE_MINUTES_DEFAULT = 15;

/**
 * Khách chỉ được tự hủy + hoàn tiền đơn đã thanh toán trong số phút này kể từ lúc thanh toán
 * (MVP chưa có trạng thái pha chế nên giới hạn thời gian để tránh hủy khi ly đã làm xong).
 * Có thể đổi bằng REFUND_WINDOW_MINUTES.
 */
export const REFUND_WINDOW_MINUTES_DEFAULT = 5;

export function refundWindowMs(): number {
  const minutes = Number(process.env.REFUND_WINDOW_MINUTES);
  return (
    (Number.isFinite(minutes) && minutes > 0
      ? minutes
      : REFUND_WINDOW_MINUTES_DEFAULT) * 60_000
  );
}
