/**
 * Dữ liệu mẫu cho BrewLite (chạy: `npm run seed` hoặc `npx prisma db seed`).
 * Có thể chạy lại nhiều lần: không tạo trùng, không ghi đè điểm thưởng của user.
 */
import { DiscountType, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

const PRODUCTS = [
  {
    name: 'Cà phê sữa',
    description: 'Cà phê phin đậm vị, hòa cùng sữa đặc béo ngọt.',
    category: 'Cà phê',
    price: 35000,
    imageUrl: img('photo-1509042239860-f550ce710b93'),
    stock: 80,
    isFeatured: true,
  },
  {
    name: 'Americano',
    description: 'Espresso pha loãng, hậu vị sạch và thanh.',
    category: 'Cà phê',
    price: 40000,
    imageUrl: img('photo-1495474472287-4d71bcdd2085'),
    stock: 60,
    isFeatured: false,
  },
  {
    name: 'Cappuccino',
    description: 'Espresso, sữa nóng và lớp bọt sữa mịn như mây.',
    category: 'Cà phê',
    price: 45000,
    imageUrl: img('photo-1461023058943-07fcbe16d735'),
    stock: 60,
    isFeatured: true,
  },
  {
    name: 'Latte',
    description: 'Espresso êm dịu với nhiều sữa tươi, vị ngọt tự nhiên.',
    category: 'Cà phê',
    price: 48000,
    imageUrl: img('photo-1541167760496-1628856ab772'),
    stock: 50,
    isFeatured: false,
  },
  {
    name: 'Bạc xỉu',
    description: 'Nhiều sữa, ít cà phê — ngọt dịu cho buổi chiều.',
    category: 'Cà phê',
    price: 38000,
    imageUrl: img('photo-1509042239860-f550ce710b93'),
    stock: 70,
    isFeatured: false,
  },
  {
    name: 'Trà đào',
    description: 'Trà đen thơm, đào miếng giòn mát, vị chua ngọt cân bằng.',
    category: 'Trà trái cây',
    price: 39000,
    imageUrl: img('photo-1556679343-c7306c1976bc'),
    stock: 70,
    isFeatured: true,
  },
  {
    name: 'Trà vải',
    description: 'Trà hoa nhài kết hợp vải thiều tươi mát.',
    category: 'Trà trái cây',
    price: 39000,
    imageUrl: img('photo-1556679343-c7306c1976bc'),
    stock: 50,
    isFeatured: false,
  },
  {
    name: 'Trà chanh mật ong',
    description: 'Chanh tươi, mật ong và trà xanh — nhẹ người, tỉnh táo.',
    category: 'Trà trái cây',
    price: 35000,
    imageUrl: img('photo-1556679343-c7306c1976bc'),
    stock: 50,
    isFeatured: false,
  },
  {
    name: 'Trà sữa trân châu',
    description: 'Trà sữa đậm vị cùng trân châu đen dai mềm.',
    category: 'Trà sữa',
    price: 42000,
    imageUrl: img('photo-1558857563-b371033873b8'),
    stock: 90,
    isFeatured: true,
  },
  {
    name: 'Trà sữa matcha',
    description: 'Matcha Nhật xay mịn, béo nhẹ và thơm dịu.',
    category: 'Trà sữa',
    price: 48000,
    imageUrl: img('photo-1558857563-b371033873b8'),
    stock: 40,
    isFeatured: false,
  },
  {
    name: 'Cacao đá xay',
    description: 'Cacao đậm đà xay lạnh, phủ kem tươi.',
    category: 'Đá xay',
    price: 52000,
    imageUrl: img('photo-1553909489-cd47e0907980'),
    stock: 30,
    isFeatured: false,
  },
  {
    name: 'Cold brew cam',
    description: 'Cà phê ủ lạnh 18 giờ với lát cam tươi. (Hết hàng — dùng để thử trạng thái hết hàng)',
    category: 'Cà phê',
    price: 52000,
    imageUrl: img('photo-1578314675249-a6910f80cc4e'),
    stock: 100,
    isFeatured: false,
  },
];

const TOPPINGS = [
  { name: 'Trân châu đen', price: 7000 },
  { name: 'Thạch dừa', price: 6000 },
  { name: 'Pudding trứng', price: 8000 },
  { name: 'Kem cheese', price: 10000 },
  { name: 'Shot espresso', price: 10000 },
];

async function main() {
  // ---- Sản phẩm (bỏ qua nếu đã có cùng tên) ----
  for (const p of PRODUCTS) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) await prisma.product.create({ data: p });
  }

  // ---- Topping ----
  for (const t of TOPPINGS) {
    await prisma.topping.upsert({
      where: { name: t.name },
      update: { price: t.price, isActive: true },
      create: t,
    });
  }

  // ---- Khuyến mãi (làm mới thời hạn mỗi lần seed) ----
  const startsAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const endsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const promotions = [
    {
      code: 'CHAO10',
      title: 'Ly đầu tiên giảm 10%',
      description: 'Dành cho khách hàng mới. Áp dụng cho đơn từ 50.000đ.',
      type: DiscountType.PERCENT,
      value: 10,
      minOrder: 50000,
      maxDiscount: 20000,
      usageLimit: null,
    },
    {
      code: 'GIAM15K',
      title: 'Giảm 15.000đ cho đơn từ 100.000đ',
      description: 'Uống cùng bạn bè, tiết kiệm nhiều hơn.',
      type: DiscountType.FIXED,
      value: 15000,
      minOrder: 100000,
      maxDiscount: null,
      usageLimit: null,
    },
    {
      code: 'COMBO20',
      title: 'Giảm 20% cho đơn từ 150.000đ',
      description: 'Tối đa 40.000đ. Số lượng có hạn.',
      type: DiscountType.PERCENT,
      value: 20,
      minOrder: 150000,
      maxDiscount: 40000,
      usageLimit: 100,
    },
  ];
  for (const promo of promotions) {
    await prisma.promotion.upsert({
      where: { code: promo.code },
      update: { ...promo, startsAt, endsAt, isActive: true },
      create: { ...promo, startsAt, endsAt },
    });
  }

  // ---- Tài khoản demo ----
  await prisma.user.upsert({
    where: { email: 'demo@brewlite.vn' },
    update: {},
    create: {
      name: 'Khách Demo',
      email: 'demo@brewlite.vn',
      phone: '0901234567',
      passwordHash: await bcrypt.hash('Demo1234', 10),
      role: Role.CUSTOMER,
      loyaltyPoints: 120,
    },
  });
  await prisma.user.upsert({
    where: { email: 'staff@brewlite.vn' },
    update: {},
    create: {
      name: 'Barista Quầy 1',
      email: 'staff@brewlite.vn',
      passwordHash: await bcrypt.hash('Staff1234', 10),
      role: Role.STAFF,
    },
  });

  console.log('Seed xong: sản phẩm, topping, khuyến mãi, tài khoản demo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
