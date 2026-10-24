import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  DEFAULT_ICE,
  DEFAULT_SUGAR,
  ICE_LEVELS,
  SIZES,
  SUGAR_LEVELS,
} from '../common/pricing';
import { PrismaService } from '../prisma/prisma.service';
import { ListProductsQuery } from './dto/list-products.query';

const PRODUCT_SELECT = {
  id: true,
  name: true,
  description: true,
  category: true,
  price: true,
  imageUrl: true,
  stock: true,
  isFeatured: true,
} satisfies Prisma.ProductSelect;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListProductsQuery) {
    const where: Prisma.ProductWhereInput = { isActive: true };
    if (query.category) where.category = query.category;
    if (query.search) {
      where.name = { contains: query.search.trim(), mode: 'insensitive' };
    }
    if (query.featured) where.isFeatured = true;

    const products = await this.prisma.product.findMany({
      where,
      select: PRODUCT_SELECT,
      orderBy: { id: 'asc' },
    });
    return products.map((p) => ({ ...p, inStock: p.stock > 0 }));
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, isActive: true },
      select: PRODUCT_SELECT,
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    const toppings = await this.prisma.topping.findMany({
      where: { isActive: true },
      select: { id: true, name: true, price: true },
      orderBy: { id: 'asc' },
    });

    return {
      ...product,
      inStock: product.stock > 0,
      options: {
        sizes: SIZES,
        toppings,
        sugarLevels: SUGAR_LEVELS,
        iceLevels: ICE_LEVELS,
        defaultSugar: DEFAULT_SUGAR,
        defaultIce: DEFAULT_ICE,
      },
    };
  }
}
