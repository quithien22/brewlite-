// Backend: Orders history & Home products logic
import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ListProductsQuery } from './dto/list-products.query';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  /**
   * Lấy danh sách sản phẩm (hỗ trợ phân trang, lọc theo danh mục)
   * GET /products
   */
  @Get()
  findAll(@Query() query: ListProductsQuery) {
    return this.products.findAll(query);
  }

 /**
   * Lấy chi tiết sản phẩm theo ID cho màn hình ProductDetailView
   * GET /products/:id
   *
   * - Sử dụng ParseIntPipe để ép kiểu tham số sang number và bắt lỗi 400 nếu id không hợp lệ.
   * - Trả về dữ liệu chuẩn cấu trúc ProductDetail mà frontend mong đợi.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.products.findOne(id);
  }
}
