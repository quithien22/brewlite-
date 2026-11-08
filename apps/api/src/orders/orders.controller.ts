import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, JwtAuthGuard } from '../auth/auth.guards';
import type { AuthUser } from '../auth/jwt.strategy';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQuery } from './dto/order-query.dto';
import { OrdersService } from './orders.service';

/**
 * Không có API nào cho client đặt trạng thái đơn trực tiếp (AC-25.4):
 * trạng thái chỉ đổi qua thanh toán, hủy đơn hoặc hết hạn.
 */
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  /** POST /orders — tạo đơn (PENDING) từ giỏ hàng */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user.id, dto);
  }

  /** GET /orders/me — lịch sử đơn của user (phải khai báo trước :id) */
  @Get('me')
  listMine(@CurrentUser() user: AuthUser, @Query() query: ListOrdersQuery) {
    return this.orders.listForUser(user.id, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.orders.findOneForUser(user.id, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.orders.cancel(user.id, id);
  }
}
