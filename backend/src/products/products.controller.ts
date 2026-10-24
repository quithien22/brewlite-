import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ListProductsQuery } from './dto/list-products.query';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  /** GET /products — danh sách menu */
  @Get()
  findAll(@Query() query: ListProductsQuery) {
    return this.products.findAll(query);
  }

  /** GET /products/:id — chi tiết + tùy chọn size/topping */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.products.findOne(id);
  }
}
