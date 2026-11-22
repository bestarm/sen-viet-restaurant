export type WarehouseLocation =
  | 'KHO_KHO'
  | 'KHO_DONG_LANH'
  | 'KHO_BE_SONG'
  | 'KHO_BEP'
  | 'KHO_BAR';

export type WarehouseDocType =
  | 'NHAP'
  | 'XUAT_CHUYEN'
  | 'XUAT_CHUYEN_NOI_BO'
  | 'HUY'
  | 'XUAT_HUY'
  | 'XUAT_BEP'
  | 'KIEM_KE'
  | string;

export interface WarehouseLocationMeta {
  id: WarehouseLocation;
  name: string;
  description: string;
  icon: string;
}

export const WAREHOUSE_LOCATIONS: WarehouseLocationMeta[] = [
  {
    id: 'KHO_KHO',
    name: 'Kho Khô',
    description: 'Gia vị, gạo, đường, đồ hộp, cồn thạch, dầu ăn...',
    icon: 'Package',
  },
  {
    id: 'KHO_DONG_LANH',
    name: 'Kho Đông Lạnh',
    description: 'Thịt bò Mỹ, sườn, ba chỉ, cá phi lê Nauy, mực...',
    icon: 'Snowflake',
  },
  {
    id: 'KHO_BE_SONG',
    name: 'Kho Bể Sống',
    description: 'Cua Cà Mau, ghẹ Phú Quốc, tôm càng xanh, ốc hương...',
    icon: 'Fish',
  },
  {
    id: 'KHO_BEP',
    name: 'Kho Bếp',
    description: 'Nguyên liệu đã xuất sang bếp chế biến trong ca...',
    icon: 'Flame',
  },
  {
    id: 'KHO_BAR',
    name: 'Kho Bar',
    description: 'Nước ngọt lon, bia, rượu, siro, hoa quả quầy bar...',
    icon: 'GlassWater',
  },
];

export const WAREHOUSE_LOCATION_NAMES: Record<WarehouseLocation, string> = {
  KHO_KHO: 'Kho Khô (Gia vị & Hàng khô)',
  KHO_DONG_LANH: 'Kho Đông Lạnh (Thịt & Hải sản đông lạnh)',
  KHO_BE_SONG: 'Kho Bể Sống (Hải sản tươi sống)',
  KHO_BEP: 'Kho Bếp (Nguyên liệu chế biến tại bếp)',
  KHO_BAR: 'Kho Bar (Quầy bar & Đồ uống)',
};

/**
 * Tự động gán phân vùng kho lưu trữ chuẩn dựa theo loại mặt hàng / danh mục
 */
export function getItemDefaultLocation(
  category?: string,
  costGroup?: string,
  itemName?: string
): WarehouseLocation {
  const text = `${category || ''} ${costGroup || ''} ${itemName || ''}`.toLowerCase();
  if (
    text.includes('bể') ||
    text.includes('cua') ||
    text.includes('ghẹ') ||
    text.includes('tôm') ||
    text.includes('ốc') ||
    text.includes('hải sản chính') ||
    text.includes('vỏ cứng') ||
    text.includes('bề bề')
  ) {
    return 'KHO_BE_SONG';
  }
  if (
    text.includes('lạnh') ||
    text.includes('thịt') ||
    text.includes('bò') ||
    text.includes('sườn') ||
    text.includes('ba chỉ') ||
    text.includes('cá hồi') ||
    text.includes('mực') ||
    text.includes('đông lạnh')
  ) {
    return 'KHO_DONG_LANH';
  }
  if (
    text.includes('bar') ||
    text.includes('đồ uống') ||
    text.includes('nước ngọt') ||
    text.includes('bia') ||
    text.includes('rượu') ||
    text.includes('coca') ||
    text.includes('nước suối') ||
    text.includes('trà')
  ) {
    return 'KHO_BAR';
  }
  if (text.includes('tại bếp') || text.includes('bếp dùng')) {
    return 'KHO_BEP';
  }
  return 'KHO_KHO';
}
