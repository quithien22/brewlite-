import { IsBoolean, IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsInt()
  @Min(1)
  orderId: number;

  @IsIn(['WALLET', 'CARD'], { message: 'Phương thức thanh toán không hợp lệ' })
  method: 'WALLET' | 'CARD';

  /** Chỉ dùng để demo: ép cổng thanh toán giả lập trả lỗi. */
  @IsOptional()
  @IsBoolean()
  simulateFailure?: boolean;
}
