import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { IsInt, IsString, MaxLength, Min } from 'class-validator';
import { PromotionsService } from './promotions.service';

export class ValidateCouponDto {
  @IsString({ message: 'Vui lòng nhập mã giảm giá' })
  @MaxLength(30)
  code: string;

  @IsInt()
  @Min(0)
  subtotal: number;
}

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  /** GET /promotions — danh sách khuyến mãi đang chạy */
  @Get()
  list() {
    return this.promotions.listActive();
  }

  /** POST /promotions/validate — kiểm tra mã ở giỏ hàng */
  @Post('validate')
  @HttpCode(200)
  validate(@Body() dto: ValidateCouponDto) {
    return this.promotions.validate(dto.code, dto.subtotal);
  }
}
