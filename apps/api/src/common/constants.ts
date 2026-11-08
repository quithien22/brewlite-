/** Giao dịch PROCESSING quá thời hạn này được xem là thất bại (cổng không phản hồi). */
export const PAYMENT_PROCESSING_TTL_MS = 2 * 60 * 1000;

/** Đơn chưa thanh toán quá số phút này sẽ tự hủy (FR-27). Có thể đổi bằng ORDER_EXPIRE_MINUTES. */
export const ORDER_EXPIRE_MINUTES_DEFAULT = 15;
