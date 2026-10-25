

export const mockData = {
  categories: [
    { id: "c1", name: "Cà phê", slug: "ca-phe" },
    { id: "c2", name: "Trà", slug: "tra" },
    { id: "c3", name: "Trà sữa", slug: "tra-sua" },
    { id: "c4", name: "Bánh", slug: "banh" }
  ],
  toppings: [
    { id: "t1", name: "Trân châu", price: 5000 },
    { id: "t2", name: "Kem cheese", price: 8000 },
    { id: "t3", name: "Thạch", price: 5000 }
  ],
  products: [
    {
      id: "p1",
      name: "Cà phê sữa đá",
      description: "Robusta Việt rang vừa, pha phin chậm cùng sữa đặc sánh mịn.",
      basePrice: 45000,
      image: "ca-phe-sua-da.jpg"
    },
    {
      id: "p2",
      name: "Trà đào cam sả",
      description: "Trà thơm cùng đào và cam tươi mát lạnh.",
      basePrice: 45000,
      image: "tra-dao-cam-sa.jpg"
    }
  ]
};


export const categories = ['Tất cả', 'Cà phê', 'Trà', 'Trà sữa', 'Đá xay', 'Bánh'];

export const items = [
  { id: 1, name: 'Cà phê sữa đá', description: 'Đậm vị cà phê, ngọt ngào sữa đặc', price: 45000, category: 'Cà phê', image: 'ca-phe-sua-da.jpg', vegetarian: true },
  { id: 2, name: 'Trà đào cam sả', description: 'Trà thơm cùng đào và cam tươi', price: 45000, category: 'Trà', image: 'tra-dao-cam-sa.jpg', vegetarian: true },
  { id: 3, name: 'Latte êm dịu', description: 'Espresso hòa cùng sữa tươi', price: 55000, category: 'Cà phê', image: 'latte-em-diu.jpg', vegetarian: true },
  { id: 4, name: 'Matcha sữa tươi', description: 'Trà xanh Nhật Bản, sữa thanh mát', price: 55000, category: 'Trà sữa', image: 'matcha-sua-tuoi.jpg', vegetarian: true },
  { id: 5, name: 'Trà sữa ô long', description: 'Ô long rang thơm, trân châu mềm', price: 49000, category: 'Trà sữa', image: 'tra-sua-o-long.jpg', vegetarian: true },
  { id: 6, name: 'Caramel đá xay', description: 'Mát lạnh, béo thơm caramel', price: 59000, category: 'Đá xay', image: 'caramel-da-xay.jpg', vegetarian: true },
  { id: 7, name: 'Bánh sừng bò', description: 'Vỏ giòn, thơm bơ, nướng mỗi ngày', price: 35000, category: 'Bánh', image: 'banh-sung-bo.jpg', vegetarian: false },
  { id: 8, name: 'Americano đá', description: 'Espresso nguyên bản, hậu vị dịu', price: 39000, category: 'Cà phê', image: 'americano-da.jpg', vegetarian: true },
  { id: 9, name: 'Trà sen vàng', description: 'Trà ô long thanh mát, hạt sen bùi béo', price: 49000, category: 'Trà', image: 'tra-sen-vang.jpg', vegetarian: true },
  { id: 10, name: 'Cà phê cốt dừa', description: 'Cà phê đắng hòa quyện cùng cốt dừa béo ngậy', price: 55000, category: 'Đá xay', image: 'ca-phe-cot-dua.jpg', vegetarian: true },
  { id: 11, name: 'Bánh Tiramisu', description: 'Bánh mềm mịn, đậm vị cà phê và cacao', price: 45000, category: 'Bánh', image: 'banh-tiramisu.jpg', vegetarian: false },
  { id: 12, name: 'Bông lan trứng muối', description: 'Cốt bánh mềm xốp, sốt phô mai béo ngậy', price: 50000, category: 'Bánh', image: 'bong-lan-trung-muoi.jpg', vegetarian: false }
];