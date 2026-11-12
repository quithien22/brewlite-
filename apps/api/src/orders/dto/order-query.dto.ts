import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const ORDER_STATUS_VALUES = [
  'PENDING',
  'PAID',
  'PAYMENT_FAILED',
  'CANCELLED',
  'REFUNDED',
] as const;

export class ListOrdersQuery {
  @IsOptional()
  @IsIn(ORDER_STATUS_VALUES)
  status?: (typeof ORDER_STATUS_VALUES)[number];

  /** Định dạng YYYY-MM, ví dụ 2026-10 */
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'Tháng không hợp lệ' })
  month?: string;

  /** Tìm theo mã đơn, ví dụ "1042" hoặc "#1042" */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  /** Mặc định 10, tối đa 50 (AC-23.4) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}
