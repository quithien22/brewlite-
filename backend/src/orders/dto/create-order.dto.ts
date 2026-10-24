import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ICE_LEVELS,
  SIZE_CODES,
  SUGAR_LEVELS,
  type SizeCode,
} from '../../common/pricing';

export class OrderItemDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsIn(SIZE_CODES, { message: 'Size không hợp lệ' })
  size: SizeCode;

  @IsOptional()
  @IsIn(SUGAR_LEVELS, { message: 'Mức đường không hợp lệ' })
  sugar?: string;

  @IsOptional()
  @IsIn(ICE_LEVELS, { message: 'Mức đá không hợp lệ' })
  ice?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  toppingIds?: number[];

  @IsInt()
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  @Max(20, { message: 'Mỗi món tối đa 20 ly' })
  qty: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Giỏ hàng đang trống' })
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(30)
  couponCode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  pointsToUse?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
