import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
// Giả định sử dụng TypeORM/Prisma (thay đổi Provider tương ứng với ORM hiện tại của bạn)
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Product, ProductOption, Topping } from './entities';

@Module({
  // imports: [TypeOrmModule.forFeature([Product, ProductOption, Topping])],
  controllers: [ProductsController],
  providers: [ProductsService],
  /**
   * Export ProductsService để các module khác (như OrdersModule, CartModule)
   * có thể tái sử dụng hàm xác thực giá và kiểm tra tồn kho tại server.
   */
})
export class ProductsModule {}
