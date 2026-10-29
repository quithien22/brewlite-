/**
 * Sinh khóa Idempotency-Key cho mỗi lần thanh toán (backend yêu cầu 8–100 ký tự).
 * Cùng một lần bấm "Xác nhận" luôn dùng cùng một khóa; muốn thử lại thật sự
 * thì phải sinh khóa mới.
 */
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `bl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
