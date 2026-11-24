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

/**
 * 11 Nhóm Danh Mục Quy Chuẩn Cho KHO TRƯỚC CHẾ BIẾN (Mô hình Kho 2 Tầng Sen Việt Buffet)
 * Theo đặc tả TASK-FLOW-01 (SPEC-KITCHEN-5-BUTTONS-DUAL-INVENTORY-2026)
 */
export type PreProcessingCategory =
  | 'BAR'
  | 'DO_AN_NHAN_VIEN'
  | 'HANG_KHO'
  | 'HS_CHINH'
  | 'HS_PHU'
  | 'RAU'
  | 'THIT'
  | 'TIEU_HAO'
  | 'VC_CUA_GHE'
  | 'VC_VO_CUNG'
  | 'VC_KHAC';

export interface PreProcessingCategoryMeta {
  code: PreProcessingCategory;
  name: string;
  description: string;
  icon: string;
}

export const PRE_PROCESSING_CATEGORIES: PreProcessingCategoryMeta[] = [
  {
    code: 'BAR',
    name: 'Bar (Đồ uống & Tráng miệng)',
    description: 'Nước ngọt, siro, hoa quả quầy bar, rượu, bia, chè tráng miệng...',
    icon: '🍹',
  },
  {
    code: 'DO_AN_NHAN_VIEN',
    name: 'Đồ ăn nhân viên',
    description: 'Thực phẩm, gạo, gia vị dùng riêng cho ca ăn của nhân viên...',
    icon: '🍚',
  },
  {
    code: 'HANG_KHO',
    name: 'Hàng khô (Gia vị & Đồ hộp)',
    description: 'Gia vị, bột, dầu ăn, đồ khô đóng hộp, mì miến...',
    icon: '📦',
  },
  {
    code: 'HS_CHINH',
    name: 'Hải sản chính',
    description: 'Cá hồi phi lê Nauy, tôm càng sen, mực trứng, bề bề...',
    icon: '🦞',
  },
  {
    code: 'HS_PHU',
    name: 'Hải sản phụ',
    description: 'Hàu sữa, ngao hoa, sò lụa, cá viên, ốc móng tay...',
    icon: '🐟',
  },
  {
    code: 'RAU',
    name: 'Rau củ quả tươi',
    description: 'Rau muống, cải chíp, nấm kim châm, củ quả tươi, xà lách...',
    icon: '🥬',
  },
  {
    code: 'THIT',
    name: 'Thịt tươi & Đông lạnh',
    description: 'Ba chỉ bò Mỹ cuộn, sườn sụn non, thịt gà, thịt ba chỉ heo...',
    icon: '🥩',
  },
  {
    code: 'TIEU_HAO',
    name: 'Tiêu hao & Vật tư',
    description: 'Cồn khô, khăn ướt, màng bọc thực phẩm, găng tay, giấy ăn...',
    icon: '🧻',
  },
  {
    code: 'VC_CUA_GHE',
    name: 'VC Cua Ghẹ (Bể sống)',
    description: 'Lô Cua Cà Mau, Ghẹ sống trong bể sủi oxy...',
    icon: '🦀',
  },
  {
    code: 'VC_VO_CUNG',
    name: 'VC Vỏ cứng (Ốc & Sò)',
    description: 'Sò huyết, tu hài, ốc hương, ngao hai cùi...',
    icon: '🐚',
  },
  {
    code: 'VC_KHAC',
    name: 'VC khác (Thủy sản đặc biệt)',
    description: 'Các loại vỏ cứng và thủy hải sản đặc biệt khác...',
    icon: '🦐',
  },
];

export const PRE_PROCESSING_CATEGORY_MAP: Record<PreProcessingCategory, string> = {
  BAR: 'Bar (Đồ uống & Tráng miệng)',
  DO_AN_NHAN_VIEN: 'Đồ ăn nhân viên',
  HANG_KHO: 'Hàng khô (Gia vị & Đồ hộp)',
  HS_CHINH: 'Hải sản chính',
  HS_PHU: 'Hải sản phụ',
  RAU: 'Rau củ quả tươi',
  THIT: 'Thịt tươi & Đông lạnh',
  TIEU_HAO: 'Tiêu hao & Vật tư',
  VC_CUA_GHE: 'VC Cua Ghẹ (Bể sống)',
  VC_VO_CUNG: 'VC Vỏ cứng (Ốc & Sò)',
  VC_KHAC: 'VC khác (Thủy sản đặc biệt)',
};

/**
 * Tự động phân loại nguyên vật liệu vào 1 trong 11 nhóm Kho Trước Chế Biến
 */
export function getItemPreProcessingCategory(
  itemCode?: string,
  category?: string,
  costGroup?: string,
  itemName?: string
): PreProcessingCategory {
  const text = `${itemCode || ''} ${category || ''} ${costGroup || ''} ${itemName || ''}`.toLowerCase();

  if (text.includes('cua') || text.includes('ghẹ') || text.includes('vc_cua_ghe') || text.includes('bể sống') || text.includes('vận chuyển cua')) {
    return 'VC_CUA_GHE';
  }
  if (text.includes('vỏ cứng') || text.includes('ốc') || text.includes('sò') || text.includes('ngao') || text.includes('tu hài')) {
    return 'VC_VO_CUNG';
  }
  if (text.includes('nhân viên') || text.includes('do_an_nhan_vien') || text.includes('đồ ăn nv') || text.includes('gạo thơm')) {
    return 'DO_AN_NHAN_VIEN';
  }
  if (text.includes('bar') || text.includes('bia') || text.includes('nước ngọt') || text.includes('coca') || text.includes('rượu') || text.includes('siro') || text.includes('chè')) {
    return 'BAR';
  }
  if (text.includes('tiêu hao') || text.includes('tieu_hao') || text.includes('khăn') || text.includes('cồn') || text.includes('màng bọc') || text.includes('găng tay')) {
    return 'TIEU_HAO';
  }
  if (text.includes('rau') || text.includes('nấm') || text.includes('cải') || text.includes('củ quả') || text.includes('xà lách')) {
    return 'RAU';
  }
  if (text.includes('thịt') || text.includes('bò') || text.includes('heo') || text.includes('gà') || text.includes('sườn') || text.includes('ba chỉ')) {
    return 'THIT';
  }
  if (text.includes('cá hồi') || text.includes('tôm càng') || text.includes('bề bề') || text.includes('hs_chinh') || text.includes('hải sản chính')) {
    return 'HS_CHINH';
  }
  if (text.includes('mực') || text.includes('hàu') || text.includes('cá viên') || text.includes('hs_phu') || text.includes('hải sản phụ')) {
    return 'HS_PHU';
  }
  if (text.includes('hàng khô') || text.includes('hang_kho') || text.includes('gia vị') || text.includes('dầu ăn') || text.includes('bún khô') || text.includes('trứng cá')) {
    return 'HANG_KHO';
  }

  return 'VC_KHAC';
}

