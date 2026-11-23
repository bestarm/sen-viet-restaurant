// ==============================================================================
// CÔNG THỨC MÓN ĂN BUFFET (DISH RECIPES) CHO NÚT 1: LẤY HÀNG THEO CÔNG THỨC
// Liên kết món ăn hoàn chỉnh với danh sách các nguyên liệu thô trong Kho Trước Chế Biến
// ==============================================================================

export interface DishIngredientItem {
  rawItemCode: string;
  rawItemName: string;
  category: string;
  defaultQty: number;
  unit: string; // 'kg' | 'con' | 'gói' | 'bắp' | 'quả'
  isPrimary?: boolean; // Nguyên liệu chủ lực của mẻ
}

export interface DishRecipe {
  id: number;
  dishCode: string;
  dishName: string;
  category: string;
  icon: string;
  standardPortionWeight: number; // Định mức kg thành phẩm / đĩa
  yieldPlatesDefault: number; // Số đĩa tiêu chuẩn cho 1 mẻ
  ingredients: DishIngredientItem[];
}

export const DISH_RECIPES: DishRecipe[] = [
  {
    id: 1,
    dishCode: 'DISH-HAU-NUONG',
    dishName: 'Hàu nướng mỡ hành',
    category: 'Món Nướng',
    icon: '🦪',
    standardPortionWeight: 0.65,
    yieldPlatesDefault: 20,
    ingredients: [
      { rawItemCode: 'QVHAU', rawItemName: 'Hàu sữa tươi vỏ cứng', category: 'HS_CHINH', defaultQty: 12.0, unit: 'kg', isPrimary: true },
      { rawItemCode: 'QVHANHLA', rawItemName: 'Hành lá tươi', category: 'RAU', defaultQty: 1.2, unit: 'kg' },
      { rawItemCode: 'QVMO', rawItemName: 'Mỡ lợn / Mỡ phần', category: 'THIT', defaultQty: 0.8, unit: 'kg' },
      { rawItemCode: 'QVBCHH', rawItemName: 'Lạc rang & Muối gia vị', category: 'HANG_KHO', defaultQty: 0.4, unit: 'kg' },
    ],
  },
  {
    id: 2,
    dishCode: 'DISH-CUA-ME',
    dishName: 'Cua sốt me',
    category: 'Món Nóng',
    icon: '🦀',
    standardPortionWeight: 0.70,
    yieldPlatesDefault: 15,
    ingredients: [
      { rawItemCode: 'QVCUATHIT', rawItemName: 'Cua thịt Cà Mau', category: 'HS_CHINH', defaultQty: 10.0, unit: 'kg', isPrimary: true },
      { rawItemCode: 'QVME', rawItemName: 'Nước cốt me chua', category: 'HANG_KHO', defaultQty: 1.5, unit: 'kg' },
      { rawItemCode: 'QVBCHH', rawItemName: 'Gia vị sốt chua ngọt', category: 'HANG_KHO', defaultQty: 0.5, unit: 'kg' },
      { rawItemCode: 'QVTOT', rawItemName: 'Tỏi & Ớt tươi', category: 'RAU', defaultQty: 0.3, unit: 'kg' },
    ],
  },
  {
    id: 3,
    dishCode: 'DISH-GHE-HAP',
    dishName: 'Ghẹ hấp sả',
    category: 'Món Hấp',
    icon: '🦀',
    standardPortionWeight: 0.60,
    yieldPlatesDefault: 18,
    ingredients: [
      { rawItemCode: 'QVGHE', rawItemName: 'Ghẹ tươi sống', category: 'HS_CHINH', defaultQty: 11.0, unit: 'kg', isPrimary: true },
      { rawItemCode: 'QVVSA', rawItemName: 'Sả củ tươi', category: 'RAU', defaultQty: 1.0, unit: 'kg' },
      { rawItemCode: 'QVBCHH', rawItemName: 'Bia & Muối hấp', category: 'BAR', defaultQty: 2.0, unit: 'lon' },
    ],
  },
  {
    id: 4,
    dishCode: 'DISH-BO-SOT-TIEU',
    dishName: 'Bò sốt tiêu đen',
    category: 'Món Nóng',
    icon: '🥩',
    standardPortionWeight: 0.50,
    yieldPlatesDefault: 20,
    ingredients: [
      { rawItemCode: 'QVBAP', rawItemName: 'Bắp Bò tươi', category: 'THIT', defaultQty: 8.0, unit: 'kg', isPrimary: true },
      { rawItemCode: 'QVTIEUDEN', rawItemName: 'Tiêu đen & Sốt tiêu', category: 'HANG_KHO', defaultQty: 0.8, unit: 'kg' },
      { rawItemCode: 'QVHANHTAY', rawItemName: 'Hành tây & Ớt chuông', category: 'RAU', defaultQty: 1.5, unit: 'kg' },
    ],
  },
  {
    id: 5,
    dishCode: 'DISH-TOM-NUONG',
    dishName: 'Tôm sú nướng muối ớt',
    category: 'Món Nướng',
    icon: '🦐',
    standardPortionWeight: 0.45,
    yieldPlatesDefault: 25,
    ingredients: [
      { rawItemCode: 'QVTOMSU', rawItemName: 'Tôm Sú tươi', category: 'HS_CHINH', defaultQty: 9.0, unit: 'kg', isPrimary: true },
      { rawItemCode: 'QVBCHH', rawItemName: 'Muối Hảo Hảo & Ớt nướng', category: 'HANG_KHO', defaultQty: 0.5, unit: 'gói' },
    ],
  },
  {
    id: 6,
    dishCode: 'DISH-MUC-CHIEN',
    dishName: 'Mực chiên giòn',
    category: 'Món Nóng',
    icon: '🦑',
    standardPortionWeight: 0.40,
    yieldPlatesDefault: 20,
    ingredients: [
      { rawItemCode: 'QVMUC', rawItemName: 'Mực ống Phú Quốc', category: 'HS_CHINH', defaultQty: 7.0, unit: 'kg', isPrimary: true },
      { rawItemCode: 'QVBANHXEO', rawItemName: 'Bột chiên giòn & Bột xù', category: 'HANG_KHO', defaultQty: 1.5, unit: 'gói' },
      { rawItemCode: 'QVBCHH', rawItemName: 'Dầu ăn chiên ngập', category: 'HANG_KHO', defaultQty: 2.0, unit: 'lít' },
    ],
  },
  {
    id: 7,
    dishCode: 'DISH-BA-CHI-NUONG',
    dishName: 'Ba chỉ bò nướng tảng',
    category: 'Món Nướng',
    icon: '🥓',
    standardPortionWeight: 0.55,
    yieldPlatesDefault: 22,
    ingredients: [
      { rawItemCode: 'QVBCBT', rawItemName: 'Ba Chỉ Bò Thanh', category: 'THIT', defaultQty: 10.0, unit: 'kg', isPrimary: true },
      { rawItemCode: 'QVBCHH', rawItemName: 'Sốt ướp nướng BBQ', category: 'HANG_KHO', defaultQty: 1.0, unit: 'kg' },
      { rawItemCode: 'QVNAMKIM', rawItemName: 'Nấm kim châm cuộn', category: 'RAU', defaultQty: 1.5, unit: 'kg' },
    ],
  },
  {
    id: 8,
    dishCode: 'DISH-CA-HOI-CHANH-LEO',
    dishName: 'Cá hồi sốt chanh leo',
    category: 'Món Nóng',
    icon: '🐟',
    standardPortionWeight: 0.45,
    yieldPlatesDefault: 16,
    ingredients: [
      { rawItemCode: 'QVCAHOI', rawItemName: 'Cá Hồi phi lê tươi', category: 'HS_PHU', defaultQty: 6.5, unit: 'kg', isPrimary: true },
      { rawItemCode: 'QVCHANHLEO', rawItemName: 'Nước cốt chanh leo tươi', category: 'RAU', defaultQty: 1.2, unit: 'kg' },
      { rawItemCode: 'QVBCHH', rawItemName: 'Bơ Pháp & Gia vị sốt', category: 'HANG_KHO', defaultQty: 0.6, unit: 'kg' },
    ],
  },
];
