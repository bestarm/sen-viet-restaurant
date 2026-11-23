import * as XLSX from 'xlsx';
import { db, ProcessedDish } from '../db/schema';
import { simulateLatency, initializeDatabaseIfEmpty } from '../db/dbService';
import {
  WarehouseLocation,
  getItemDefaultLocation,
  WAREHOUSE_LOCATIONS as DEFAULT_WAREHOUSE_LOCATIONS,
  WAREHOUSE_LOCATION_NAMES,
  PreProcessingCategory,
  PreProcessingCategoryMeta,
  PRE_PROCESSING_CATEGORIES,
  PRE_PROCESSING_CATEGORY_MAP,
  getItemPreProcessingCategory,
} from '../types/warehouse';

export type { WarehouseLocation, ProcessedDish, PreProcessingCategory, PreProcessingCategoryMeta };
export { PRE_PROCESSING_CATEGORIES, PRE_PROCESSING_CATEGORY_MAP, getItemPreProcessingCategory };

export interface Supplier {
  id: number;
  supplierCode: string;
  supplierName: string;
  phone?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

export interface CreateSupplierRequest {
  supplierCode: string;
  supplierName: string;
  phone?: string;
  address?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface ImportBatch {
  id: number;
  batchCode: string;
  supplierId?: number;
  supplierCode?: string;
  supplierName?: string;
  itemId: number;
  itemCode?: string;
  itemName?: string;
  category?: string;
  preProcessingCategory?: PreProcessingCategory;
  branchId?: number;
  branchName?: string;
  importDate: string;
  expiryDate?: string;
  initialQuantity: number;
  currentStock: number;
  unitPrice: number;
  unit: string;
  status?: string;
  location?: WarehouseLocation;
  warehouseLocation?: string;
}

export type PhysicalWarehouseLocation =
  | 'KHO_KHO'
  | 'KHO_DONG_LANH'
  | 'KHO_BE_SONG'
  | 'KHO_BEP'
  | 'KHO_BAR';

export interface WarehouseLocationOption {
  id: string;
  code: string;
  name: string;
  desc?: string;
  icon?: string;
}

export const WAREHOUSE_LOCATIONS: WarehouseLocationOption[] = [
  { id: 'ALL', code: 'ALL', name: 'Tất cả kho', desc: 'Toàn bộ 5 phân vùng kho', icon: '🏢' },
  { id: 'KHO_KHO', code: 'KHO_KHO', name: 'Kho khô', desc: 'Gia vị, gạo, đường, đồ hộp, cồn thạch...', icon: '📦' },
  { id: 'KHO_DONG_LANH', code: 'KHO_DONG_LANH', name: 'Kho đông lạnh', desc: 'Thịt bò, sườn, ba chỉ, cá phi lê...', icon: '❄️' },
  { id: 'KHO_BE_SONG', code: 'KHO_BE_SONG', name: 'Bể hải sản sống', desc: 'Cua thịt, ghẹ, tôm càng, bề bề, ốc hương...', icon: '🦀' },
  { id: 'KHO_BEP', code: 'KHO_BEP', name: 'Kho bếp', desc: 'Nguyên liệu đã xuất sang bếp chế biến trong ngày...', icon: '🍳' },
  { id: 'KHO_BAR', code: 'KHO_BAR', name: 'Kho bar', desc: 'Trái cây, nước ngọt, bia, rượu, chè...', icon: '🍹' },
];

export function getItemWarehouseLocation(
  itemCode?: string,
  category?: string,
  explicitLocation?: string
): PhysicalWarehouseLocation {
  if (explicitLocation && explicitLocation !== 'ALL') {
    return explicitLocation as PhysicalWarehouseLocation;
  }
  const code = (itemCode || '').toUpperCase();
  const cat = (category || '').toLowerCase();

  if (
    code.includes('CUA') ||
    code.includes('GHE') ||
    code.includes('TOM') ||
    code.includes('BEBE') ||
    code.includes('OCHUONG') ||
    cat.includes('sống') ||
    cat.includes('hải sản chính')
  ) {
    return 'KHO_BE_SONG';
  }

  if (
    code.includes('BO') ||
    code.includes('THIT') ||
    code.includes('SUON') ||
    code.includes('BACHI') ||
    code.includes('MUC') ||
    code.includes('BACHTUOC') ||
    code.includes('HAU') ||
    cat.includes('thịt') ||
    cat.includes('đông lạnh')
  ) {
    return 'KHO_DONG_LANH';
  }

  if (
    code.includes('BAR') ||
    code.includes('BIA') ||
    code.includes('RUOU') ||
    code.includes('NUOC') ||
    cat.includes('bar') ||
    cat.includes('đồ uống') ||
    cat.includes('tráng miệng')
  ) {
    return 'KHO_BAR';
  }

  if (
    code.includes('BEP') ||
    cat.includes('rau') ||
    cat.includes('nấm')
  ) {
    return 'KHO_BEP';
  }

  return 'KHO_KHO';
}

export interface WarehouseDocumentItem {
  id?: number;
  documentId?: number;
  itemId: number;
  itemCode?: string;
  itemName?: string;
  batchId?: number;
  batchCode?: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  expiryDate?: string;
  supplierReportedWeight?: number; // Khối lượng NCC báo (kg)
  actualWeight?: number;          // Khối lượng thực cân (kg)
  weightDiff?: number;            // Lệch = actualWeight - supplierReportedWeight
  shortageAmount?: number;        // Tiền phạt/trừ do cân thiếu
  reason?: string;
  lossCategory?: 'HAI_SAN_CHET_NCC' | 'HONG_BAO_QUAN_KHO' | 'BEP_LAM_HONG' | string;
  preProcessingCategory?: PreProcessingCategory; // 1 trong 11 danh mục Kho Trước Chế Biến
  location?: WarehouseLocation;
  targetLocation?: WarehouseLocation;
  warehouseLocation?: string;
}

export interface WarehouseDocument {
  id: number;
  docType: 'NHAP' | 'XUAT_CHUYEN' | 'XUAT_CHUYEN_NOI_BO' | 'HUY' | 'XUAT_HUY' | 'XUAT_BEP' | 'KIEM_KE' | string;
  docCode: string;
  branchId?: number;
  branchName?: string;
  location?: WarehouseLocation;
  targetLocation?: WarehouseLocation;
  supplierId?: number;
  supplierName?: string;
  supplierCode?: string;
  createdBy?: string;
  createdByName?: string;
  status?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectReason?: string;
  rejectedAt?: string;
  warehouseLocation?: string;
  note?: string;
  totalAmount: number;
  totalReportedAmount?: number;    // Tổng tiền theo khối lượng NCC báo
  totalShortageAmount?: number;    // Tổng tiền bị trừ do cân thiếu
  finalPayableAmount?: number;     // Công nợ thực tế phải trả = totalReportedAmount - totalShortageAmount
  imageUrls?: string;
  createdAt: string;
  items: WarehouseDocumentItem[];
}

export interface CreateDocumentRequest {
  branchId?: number;
  branchCode?: string;
  docType: 'NHAP' | 'XUAT_CHUYEN' | 'XUAT_CHUYEN_NOI_BO' | 'HUY' | 'XUAT_HUY' | 'XUAT_BEP' | 'KIEM_KE' | string;
  location?: WarehouseLocation;
  targetLocation?: WarehouseLocation;
  supplierId?: number;
  status?: string;
  warehouseLocation?: string;
  note?: string;
  imageUrls?: string;
  items: {
    itemId: number;
    quantity: number;
    unitPrice: number;
    expiryDate?: string;
    batchId?: number;
    supplierReportedWeight?: number;
    actualWeight?: number;
    weightDiff?: number;
    shortageAmount?: number;
    reason?: string;
    lossCategory?: 'HAI_SAN_CHET_NCC' | 'HONG_BAO_QUAN_KHO' | 'BEP_LAM_HONG' | string;
    preProcessingCategory?: PreProcessingCategory;
    location?: WarehouseLocation;
    targetLocation?: WarehouseLocation;
    warehouseLocation?: string;
  }[];
}

export interface DebtAdjustment {
  id: number;
  supplierId: number;
  supplierCode?: string;
  supplierName?: string;
  branchCode: string;
  periodId?: number;
  periodStartDate?: string;
  periodEndDate?: string;
  totalReportedWeight?: number;
  totalActualWeight?: number;
  weightDiff?: number;
  shortageAmount?: number;
  adjustmentAmount: number;
  reason: string;
  status: 'CHO_DUYET' | 'DA_CHOT';
  adjustedBy: string;
  createdAt: string;
  closedAt?: string;
}

export interface CreateDebtAdjustmentRequest {
  supplierId: number;
  branchCode?: string;
  periodId?: number;
  periodStartDate?: string;
  periodEndDate?: string;
  totalReportedWeight?: number;
  totalActualWeight?: number;
  weightDiff?: number;
  shortageAmount?: number;
  adjustmentAmount: number;
  reason: string;
  status?: 'CHO_DUYET' | 'DA_CHOT';
  adjustedBy?: string;
}

export interface ReconciliationPeriod {
  id: number;
  supplierId: number;
  supplierCode?: string;
  supplierName?: string;
  branchCode: string;
  periodStartDate: string;
  periodEndDate: string;
  totalReportedWeight: number;
  totalActualWeight: number;
  weightDiff: number;
  shortageAmount: number;
  adjustmentAmount: number;
  finalPayableDebt?: number;
  reason?: string;
  status: 'CHO_DUYET' | 'DA_CHOT';
  adjustedBy?: string;
  createdAt: string;
  closedAt?: string;
}

export interface StockLedgerEntry {
  id: number | string;
  docCode: string;
  docType: 'NHAP' | 'XUAT_BEP' | 'XUAT_HUY' | 'KIEM_KE' | string;
  docTypeName: string;
  date: string;
  itemId: number;
  itemCode?: string;
  itemName?: string;
  batchCode?: string;
  inQty: number;
  outQty: number;
  changeQty: number;
  balance: number;
  unit: string;
  partnerOrReason?: string;
  performer?: string;
  note?: string;
  branchCode?: string;
}

export interface SupplierDebtSummary {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  phone?: string;
  address?: string;
  branchId?: number;
  totalInvoicesCount: number;
  totalReportedWeight: number; // Tổng khối lượng NCC báo (kg)
  totalActualWeight: number;   // Tổng khối lượng thực cân (kg)
  totalWeightDiff: number;     // Lệch = Thực cân - NCC báo (kg)
  totalReportedAmount: number; // Tổng tiền hóa đơn NCC báo (đ)
  totalShortageDeduction: number; // Tiền giảm trừ công nợ do cân thiếu (đ)
  finalPayableDebt: number;    // Công nợ thực tế phải trả cuối tháng = totalReportedAmount - totalShortageDeduction
  disputeStatus: 'KHOP_DU' | 'LECH_CAN_THIEU' | 'CAN_XAC_MINH';
  lastImportDate?: string;
}

export interface InventoryStock {
  id: number;
  branchId: number;
  branchName?: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  category?: string;
  batchId?: number;
  batchCode?: string;
  quantity: number;
  unit: string;
  lastUpdatedAt: string;
  location?: WarehouseLocation;
  warehouseLocation?: string;
}

export interface InventoryCheckItem {
  id?: number;
  checkId?: number;
  itemId: number;
  itemCode?: string;
  itemName?: string;
  category?: string;
  batchId?: number;
  batchCode?: string;
  systemStock: number;
  actualStock: number;
  difference?: number;
  reason?: string;
  unit?: string;
}

export interface InventoryCheck {
  id: number;
  checkCode: string;
  branchId?: number;
  branchName?: string;
  shift: 'CA_SANG' | 'CA_TOI' | 'CA_NGAY' | 'SANG' | 'TOI' | string;
  checkDate: string;
  checkedBy?: string;
  checkedByName?: string;
  status?: string;
  note?: string;
  createdAt: string;
  items: InventoryCheckItem[];
}

export interface CreateInventoryCheckRequest {
  branchId?: number;
  shift: string;
  checkDate: string;
  note?: string;
  items: {
    itemId: number;
    batchId?: number;
    systemStock?: number;
    actualStock: number;
    reason?: string;
  }[];
}

export interface SupplierLossReport {
  supplierId?: number;
  supplierCode: string;
  supplierName: string;
  reportCount?: number;
  importedQuantity?: number;
  totalPurchasedQty?: number;
  damagedQuantity?: number;
  totalDamagedQty?: number;
  lossRate?: number;
  damageRatePercentage?: number;
  damagedAmount?: number;
  totalEstimatedLossAmount?: number;
  ranking?: number;
  rank?: number;
  defectCount?: number;
  evaluation?: string;
  unit?: string;
}

export const warehouseApi = {
  // --- Suppliers ---
  getSuppliers: async (keyword?: string): Promise<Supplier[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    let list = await db.suppliers.toArray();
    if (keyword && keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.supplierName.toLowerCase().includes(q) ||
          s.supplierCode.toLowerCase().includes(q) ||
          (s.phone && s.phone.includes(q))
      );
    }
    return list;
  },

  createSupplier: async (data: CreateSupplierRequest): Promise<Supplier> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 150);

    const newSupplier: Supplier = {
      id: Date.now(),
      supplierCode: data.supplierCode || `NCC-${Date.now().toString().slice(-4)}`,
      supplierName: data.supplierName,
      phone: data.phone,
      address: data.address,
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    await db.suppliers.add(newSupplier);
    return newSupplier;
  },

  updateSupplier: async (id: number, data: Partial<CreateSupplierRequest>): Promise<Supplier> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 150);

    await db.suppliers.update(id, data);
    const updated = await db.suppliers.get(id);
    if (!updated) throw new Error('Không tìm thấy nhà cung cấp');
    return updated;
  },

  // --- Batches (Lô nhập) ---
  getAvailableBatches: async (
    arg1?: number | { branchId?: number; itemId?: number; branchCode?: string },
    arg2?: string | number
  ): Promise<ImportBatch[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    let itemId: number | undefined;
    let branchId: number | undefined;
    let branchCode: string | undefined;

    if (typeof arg1 === 'number') {
      itemId = arg1;
      if (typeof arg2 === 'string') {
        branchCode = arg2;
      } else if (typeof arg2 === 'number') {
        branchId = arg2;
      }
    } else if (typeof arg1 === 'object' && arg1 !== null) {
      itemId = arg1.itemId;
      branchId = arg1.branchId;
      branchCode = arg1.branchCode;
    }

    if (!branchId && branchCode) {
      if (branchCode.toUpperCase() === 'TN') branchId = 1;
      else if (branchCode.toUpperCase() === 'QV') branchId = 2;
    }

    let list = await db.inventoryLots.toArray();
    if (branchId) {
      list = list.filter(
        (b) => !b.branchId || b.branchId === branchId || (branchCode && b.branchCode === branchCode)
      );
    }
    if (itemId) {
      list = list.filter((b) => b.itemId === itemId);
    }
    return list.filter((b) => b.currentStock === undefined || b.currentStock > 0);
  },

  getAllBatches: async (params?: { branchId?: number; itemId?: number }): Promise<ImportBatch[]> => {
    return warehouseApi.getAvailableBatches(params);
  },

  // --- Inventory Stocks ---
  getStocks: async (params?: {
    branchId?: number;
    itemId?: number;
    location?: WarehouseLocation;
    warehouseLocation?: string;
  }): Promise<InventoryStock[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const lots = await db.inventoryLots.toArray();
    const items = await db.items.toArray();
    const itemMap = new Map(items.map((i) => [i.id, i]));

    const stocks: InventoryStock[] = lots.map((lot) => {
      const it = itemMap.get(lot.itemId);
      const loc: WarehouseLocation =
        lot.location ||
        (lot.warehouseLocation as WarehouseLocation) ||
        getItemWarehouseLocation(lot.itemCode, it?.category);
      return {
        id: lot.id,
        branchId: lot.branchId || 1,
        branchName: lot.branchName || 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
        itemId: lot.itemId,
        itemCode: lot.itemCode || it?.itemCode || 'M-01',
        itemName: lot.itemName || it?.itemName || 'Món ăn',
        category: it?.category || 'Nguyên liệu',
        batchId: lot.id,
        batchCode: lot.batchCode,
        quantity: lot.currentStock,
        unit: lot.unit || it?.unit || 'kg',
        lastUpdatedAt: lot.importDate || '2026-11-18',
        location: loc,
        warehouseLocation: loc,
      };
    });

    let res = stocks;
    if (params?.branchId) {
      res = res.filter((s) => s.branchId === params.branchId);
    }
    if (params?.itemId) {
      res = res.filter((s) => s.itemId === params.itemId);
    }
    const filterLoc =
      params?.location ||
      (params?.warehouseLocation && params.warehouseLocation !== 'ALL'
        ? (params.warehouseLocation as WarehouseLocation)
        : undefined);
    if (filterLoc) {
      res = res.filter((s) => s.location === filterLoc || s.warehouseLocation === filterLoc);
    }
    return res;
  },

  // --- Documents (Phiếu nhập / xuất / huỷ) ---
  getDocuments: async (params?: {
    branchId?: number;
    docType?: string;
    status?: string;
    location?: WarehouseLocation;
    warehouseLocation?: string;
  }): Promise<WarehouseDocument[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);

    let list = await db.warehouseDocuments.toArray();
    if (params?.branchId) {
      list = list.filter((d) => !d.branchId || d.branchId === params.branchId);
    }
    if (params?.docType) {
      list = list.filter((d) => d.docType === params.docType);
    }
    if (params?.status) {
      list = list.filter((d) => d.status === params.status);
    }
    const filterLoc =
      params?.location ||
      (params?.warehouseLocation && params.warehouseLocation !== 'ALL'
        ? (params.warehouseLocation as WarehouseLocation)
        : undefined);
    if (filterLoc) {
      list = list.filter((d) => d.location === filterLoc || d.warehouseLocation === filterLoc);
    }
    return list.reverse();
  },

  createDocument: async (data: CreateDocumentRequest): Promise<WarehouseDocument> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(140, 200);

    const supplier = data.supplierId ? await db.suppliers.get(data.supplierId) : null;
    const itemsList = await db.items.toArray();
    const itemMap = new Map(itemsList.map((i) => [i.id, i]));

    const branchId = data.branchId || (data.branchCode === 'QV' ? 2 : 1);

    // Kiểm tra chặn xuất âm kho nếu là phiếu xuất hoặc hủy
    const isPendingApproval = data.status === 'CHO_DUYET';
    const isExportOrScrap =
      data.docType === 'HUY' ||
      data.docType === 'XUAT_HUY' ||
      data.docType === 'XUAT_CHUYEN' ||
      data.docType === 'XUAT_CHUYEN_NOI_BO';

    if (isExportOrScrap) {
      for (const it of data.items) {
        const qtyToDeduct = it.actualWeight !== undefined ? it.actualWeight : it.quantity;
        let availableStock = 0;
        let targetLot: any = null;

        if (it.batchId) {
          targetLot = await db.inventoryLots.get(it.batchId);
          availableStock = targetLot?.currentStock || 0;
        } else {
          const lots = await db.inventoryLots.where('itemId').equals(it.itemId).toArray();
          const sourceLoc =
            data.location ||
            (data.warehouseLocation as WarehouseLocation) ||
            (data.docType === 'XUAT_CHUYEN_NOI_BO' ? 'KHO_KHO' : undefined);
          const branchLots = lots.filter((l) => {
            const matchesBranch = !branchId || !l.branchId || l.branchId === branchId;
            const matchesLoc =
              !sourceLoc || l.location === sourceLoc || l.warehouseLocation === sourceLoc;
            return matchesBranch && matchesLoc;
          });
          const usableLots =
            branchLots.length > 0
              ? branchLots
              : lots.filter((l) => !branchId || !l.branchId || l.branchId === branchId);
          availableStock = usableLots.reduce((sum, l) => sum + (l.currentStock || 0), 0);
          targetLot = usableLots.find((l) => (l.currentStock || 0) >= qtyToDeduct) || usableLots[0];
        }

        if (qtyToDeduct > availableStock) {
          throw new Error(
            `Số lượng xuất/hủy (${qtyToDeduct}) vượt quá tồn kho khả dụng hiện tại (${availableStock}). Không cho phép xuất âm kho!`
          );
        }

        // Trừ tồn kho trong lô hàng nguồn (nếu phiếu ở trạng thái CHO_DUYET, sẽ trừ khi duyệt chính thức)
        if (!isPendingApproval && targetLot && targetLot.currentStock !== undefined) {
          const newStock = Math.max(0, Number((targetLot.currentStock - qtyToDeduct).toFixed(2)));
          await db.inventoryLots.update(targetLot.id, { currentStock: newStock });
        }
      }
    }

    let totalReportedAmount = 0;
    let totalShortageAmount = 0;

    const docLocation =
      data.location ||
      (data.warehouseLocation as WarehouseLocation) ||
      (data.docType === 'XUAT_CHUYEN_NOI_BO'
        ? 'KHO_KHO'
        : data.docType === 'XUAT_CHUYEN'
        ? 'KHO_BEP'
        : 'KHO_KHO');

    const targetLocation =
      data.targetLocation || (data.docType === 'XUAT_CHUYEN_NOI_BO' ? 'KHO_BEP' : undefined);

    const docItems: WarehouseDocumentItem[] = data.items.map((it, idx) => {
      const foundItem = itemMap.get(it.itemId);
      const actualWeight = it.actualWeight !== undefined ? it.actualWeight : it.quantity;
      const supplierReportedWeight =
        it.supplierReportedWeight !== undefined ? it.supplierReportedWeight : it.quantity;
      const weightDiff = Number((actualWeight - supplierReportedWeight).toFixed(2));
      const shortage = weightDiff < 0 ? Math.round(Math.abs(weightDiff) * it.unitPrice) : 0;

      totalReportedAmount += supplierReportedWeight * it.unitPrice;
      totalShortageAmount += shortage;

      const itemLocation: WarehouseLocation =
        it.location ||
        (it.warehouseLocation as WarehouseLocation) ||
        (data.location as WarehouseLocation) ||
        (data.warehouseLocation as WarehouseLocation) ||
        getItemWarehouseLocation(foundItem?.itemCode, foundItem?.category);

      const itemPreCategory: PreProcessingCategory =
        it.preProcessingCategory ||
        getItemPreProcessingCategory(
          foundItem?.itemCode,
          foundItem?.category,
          foundItem?.costGroup,
          foundItem?.itemName
        );

      return {
        id: Date.now() + idx,
        itemId: it.itemId,
        itemCode: foundItem?.itemCode || 'M-01',
        itemName: foundItem?.itemName || 'Nguyên liệu',
        batchId: it.batchId,
        batchCode: it.batchId ? `LOT-${it.batchId}` : `LOT-NEW-${Date.now().toString().slice(-4)}`,
        quantity: actualWeight,
        unitPrice: it.unitPrice,
        unit: foundItem?.unit || 'kg',
        expiryDate: it.expiryDate,
        supplierReportedWeight,
        actualWeight,
        weightDiff,
        shortageAmount: shortage,
        reason: it.reason,
        lossCategory: it.lossCategory,
        preProcessingCategory: itemPreCategory,
        location: itemLocation,
        targetLocation: it.targetLocation || targetLocation,
        warehouseLocation: itemLocation,
      };
    });

    const totalAmount = data.items.reduce(
      (sum, it) => sum + (it.actualWeight ?? it.quantity) * it.unitPrice,
      0
    );
    const finalPayableAmount = Math.max(0, totalReportedAmount - totalShortageAmount);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const codePrefix =
      data.docType === 'NHAP'
        ? 'PNK'
        : data.docType === 'XUAT_CHUYEN' ||
          data.docType === 'XUAT_CHUYEN_NOI_BO' ||
          data.docType === 'XUAT_BEP'
        ? 'PXK'
        : 'PHK';
    const docCode = `${codePrefix}-${Date.now().toString().slice(-6)}`;

    const effectiveStatus = data.status || (data.docType === 'HUY' ? 'CHO_DUYET' : 'HOAN_THANH');

    const newDoc: WarehouseDocument = {
      id: Date.now(),
      docType: data.docType,
      docCode,
      branchId,
      branchName:
        branchId === 2
          ? 'Sen Việt Buffet - Chi nhánh Quế Võ'
          : 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      supplierId: data.supplierId,
      supplierName: supplier?.supplierName,
      supplierCode: supplier?.supplierCode,
      createdBy: 'ql_chinhanh_tn',
      createdByName: 'Lê Hoàng Quản Lý',
      status: effectiveStatus,
      location: docLocation,
      targetLocation: targetLocation,
      warehouseLocation: docLocation,
      note: data.note,
      totalAmount,
      totalReportedAmount,
      totalShortageAmount,
      finalPayableAmount,
      imageUrls: data.imageUrls,
      createdAt: now,
      items: docItems,
    };

    await db.warehouseDocuments.add(newDoc);

    // Cập nhật tồn kho nếu là phiếu nhập
    if (data.docType === 'NHAP') {
      for (const it of docItems) {
        const itemLoc = it.location || docLocation;
        const newLot: ImportBatch = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          batchCode: it.batchCode || `LOT-${Date.now().toString().slice(-4)}`,
          supplierId: data.supplierId,
          supplierCode: supplier?.supplierCode,
          supplierName: supplier?.supplierName,
          itemId: it.itemId,
          itemCode: it.itemCode,
          itemName: it.itemName,
          branchId,
          importDate: new Date().toISOString().slice(0, 10),
          expiryDate: it.expiryDate || '2026-12-31',
          initialQuantity: it.quantity,
          currentStock: it.quantity,
          unitPrice: it.unitPrice,
          unit: it.unit || 'kg',
          status: 'ACTIVE',
          category: it.preProcessingCategory ? PRE_PROCESSING_CATEGORY_MAP[it.preProcessingCategory] : 'Nguyên liệu',
          preProcessingCategory: it.preProcessingCategory,
          location: itemLoc,
          warehouseLocation: itemLoc,
        };
        await db.inventoryLots.add(newLot);
      }
    }

    // Cập nhật tăng tồn kho tại kho đích nếu là xuất chuyển nội bộ (ví dụ: chuyển từ Kho Khô sang Kho Bếp)
    if (!isPendingApproval && data.docType === 'XUAT_CHUYEN_NOI_BO') {
      const destLoc: WarehouseLocation = targetLocation || 'KHO_BEP';
      for (const it of docItems) {
        const qtyToAdd = it.actualWeight !== undefined ? it.actualWeight : it.quantity;
        const lots = await db.inventoryLots.where('itemId').equals(it.itemId).toArray();
        const destLot = lots.find(
          (l) =>
            (!branchId || !l.branchId || l.branchId === branchId) &&
            (l.location === destLoc || l.warehouseLocation === destLoc)
        );

        if (destLot && destLot.currentStock !== undefined) {
          const updatedStock = Number(((destLot.currentStock || 0) + qtyToAdd).toFixed(2));
          await db.inventoryLots.update(destLot.id, { currentStock: updatedStock });
        } else {
          const newDestLot: ImportBatch = {
            id: Date.now() + Math.floor(Math.random() * 1000) + 100,
            batchCode: `LOT-BEP-${Date.now().toString().slice(-4)}`,
            supplierId: data.supplierId,
            supplierCode: supplier?.supplierCode,
            supplierName: supplier?.supplierName,
            itemId: it.itemId,
            itemCode: it.itemCode,
            itemName: it.itemName,
            branchId,
            branchName:
              branchId === 2
                ? 'Sen Việt Buffet - Chi nhánh Quế Võ'
                : 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
            importDate: new Date().toISOString().slice(0, 10),
            expiryDate: it.expiryDate || '2027-12-31',
            initialQuantity: qtyToAdd,
            currentStock: qtyToAdd,
            unitPrice: it.unitPrice,
            unit: it.unit || 'kg',
            status: 'ACTIVE',
            location: destLoc,
            warehouseLocation: destLoc,
          };
          await db.inventoryLots.add(newDestLot);
        }
      }
    }

    return newDoc;
  },

  approveDocument: async (
    docId: number,
    approverName = 'Lê Hoàng Quản Lý'
  ): Promise<WarehouseDocument> => {
    await initializeDatabaseIfEmpty();
    const doc = await db.warehouseDocuments.get(docId);
    if (!doc) throw new Error('Không tìm thấy phiếu kho');

    // Trừ tồn kho nếu phiếu này đang ở trạng thái CHO_DUYET
    if (
      doc.status === 'CHO_DUYET' &&
      (doc.docType === 'HUY' ||
        doc.docType === 'XUAT_HUY' ||
        doc.docType === 'XUAT_CHUYEN' ||
        doc.docType === 'XUAT_CHUYEN_NOI_BO')
    ) {
      for (const it of doc.items) {
        const qtyToDeduct = it.actualWeight !== undefined ? it.actualWeight : it.quantity;
        if (it.batchId) {
          const lot = await db.inventoryLots.get(it.batchId);
          if (lot && lot.currentStock !== undefined) {
            const newStock = Math.max(0, Number((lot.currentStock - qtyToDeduct).toFixed(2)));
            await db.inventoryLots.update(lot.id, { currentStock: newStock });
          }
        } else {
          const lots = await db.inventoryLots.where('itemId').equals(it.itemId).toArray();
          const branchLots = lots.filter(
            (l) => !doc.branchId || !l.branchId || l.branchId === doc.branchId
          );
          const targetLot =
            branchLots.find((l) => (l.currentStock || 0) >= qtyToDeduct) || branchLots[0];
          if (targetLot && targetLot.currentStock !== undefined) {
            const newStock = Math.max(0, Number((targetLot.currentStock - qtyToDeduct).toFixed(2)));
            await db.inventoryLots.update(targetLot.id, { currentStock: newStock });
          }
        }

        // Tăng tồn kho tại kho đích nếu là xuất chuyển nội bộ
        if (doc.docType === 'XUAT_CHUYEN_NOI_BO') {
          const destLoc: WarehouseLocation = (doc.targetLocation || 'KHO_BEP') as WarehouseLocation;
          const lots = await db.inventoryLots.where('itemId').equals(it.itemId).toArray();
          const destLot = lots.find(
            (l) =>
              (!doc.branchId || !l.branchId || l.branchId === doc.branchId) &&
              (l.location === destLoc || l.warehouseLocation === destLoc)
          );
          if (destLot && destLot.currentStock !== undefined) {
            const updatedStock = Number(((destLot.currentStock || 0) + qtyToDeduct).toFixed(2));
            await db.inventoryLots.update(destLot.id, { currentStock: updatedStock });
          } else {
            const newDestLot: ImportBatch = {
              id: Date.now() + Math.floor(Math.random() * 1000) + 100,
              batchCode: `LOT-BEP-${Date.now().toString().slice(-4)}`,
              supplierId: doc.supplierId,
              supplierCode: doc.supplierCode,
              supplierName: doc.supplierName,
              itemId: it.itemId,
              itemCode: it.itemCode,
              itemName: it.itemName,
              branchId: doc.branchId || 1,
              branchName: doc.branchName,
              importDate: new Date().toISOString().slice(0, 10),
              expiryDate: it.expiryDate || '2027-12-31',
              initialQuantity: qtyToDeduct,
              currentStock: qtyToDeduct,
              unitPrice: it.unitPrice,
              unit: it.unit || 'kg',
              status: 'ACTIVE',
              location: destLoc,
              warehouseLocation: destLoc,
            };
            await db.inventoryLots.add(newDestLot);
          }
        }
      }
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await db.warehouseDocuments.update(docId, {
      status: 'DA_DUYET',
      approvedBy: approverName,
      approvedAt: now,
    });

    return (await db.warehouseDocuments.get(docId))!;
  },

  rejectDocument: async (
    docId: number,
    rejectReason = 'Quản lý từ chối duyệt xuất hủy'
  ): Promise<WarehouseDocument> => {
    await initializeDatabaseIfEmpty();
    const doc = await db.warehouseDocuments.get(docId);
    if (!doc) throw new Error('Không tìm thấy phiếu kho');

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await db.warehouseDocuments.update(docId, {
      status: 'TU_CHOI',
      rejectReason,
      rejectedAt: now,
    });

    return (await db.warehouseDocuments.get(docId))!;
  },

  // --- Inventory Checks (Kiểm kê kho) ---
  getInventoryChecks: async (params?: {
    branchId?: number;
    shift?: string;
    checkDate?: string;
  }): Promise<InventoryCheck[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);

    let list = await db.inventoryChecks.toArray();
    if (params?.branchId) {
      list = list.filter((c) => !c.branchId || c.branchId === params.branchId);
    }
    if (params?.shift) {
      list = list.filter((c) => c.shift === params.shift);
    }
    if (params?.checkDate) {
      list = list.filter((c) => c.checkDate === params.checkDate);
    }
    return list.reverse();
  },

  createInventoryCheck: async (data: CreateInventoryCheckRequest): Promise<InventoryCheck> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(140, 200);

    const itemsList = await db.items.toArray();
    const itemMap = new Map(itemsList.map((i) => [i.id, i]));
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const checkCode = `KK-${Date.now().toString().slice(-6)}`;

    const checkItems: InventoryCheckItem[] = data.items.map((it, idx) => {
      const foundItem = itemMap.get(it.itemId);
      const diff = it.actualStock - (it.systemStock || 0);
      return {
        id: Date.now() + idx,
        itemId: it.itemId,
        itemCode: foundItem?.itemCode,
        itemName: foundItem?.itemName,
        category: foundItem?.category,
        batchId: it.batchId,
        systemStock: it.systemStock || 0,
        actualStock: it.actualStock,
        difference: diff,
        reason: it.reason || (diff < 0 ? 'Thất thoát / hao hụt ca' : ''),
        unit: foundItem?.unit || 'kg',
      };
    });

    const newCheck: InventoryCheck = {
      id: Date.now(),
      checkCode,
      branchId: data.branchId || 1,
      branchName: 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      shift: data.shift,
      checkDate: data.checkDate,
      checkedBy: 'bep_tn',
      checkedByName: 'Nguyễn Văn Bếp',
      status: 'HOAN_THANH',
      note: data.note,
      createdAt: now,
      items: checkItems,
    };

    await db.inventoryChecks.add(newCheck);
    return newCheck;
  },

  // --- Supplier Loss Report ---
  getSupplierLossReport: async (params?: {
    month?: number;
    year?: number;
    branchId?: number;
    itemId?: number;
  }): Promise<SupplierLossReport[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);

    return [
      {
        supplierId: 1,
        supplierCode: 'NCC-HS01',
        supplierName: 'Công ty Hải Sản Biển Đông',
        reportCount: 3,
        importedQuantity: 185.0,
        totalPurchasedQty: 185.0,
        damagedQuantity: 4.8,
        totalDamagedQty: 4.8,
        lossRate: 2.59,
        damageRatePercentage: 2.59,
        damagedAmount: 1820000,
        totalEstimatedLossAmount: 1820000,
        rank: 1,
        ranking: 1,
        evaluation: 'Tỷ lệ hỏng trong chuẩn cho phép (<3%)',
        unit: 'kg',
      },
      {
        supplierId: 3,
        supplierCode: 'NCC-RC03',
        supplierName: 'HTX Rau Củ Quả Sạch Đà Lạt',
        reportCount: 2,
        importedQuantity: 250.0,
        totalPurchasedQty: 250.0,
        damagedQuantity: 18.0,
        totalDamagedQty: 18.0,
        lossRate: 7.2,
        damageRatePercentage: 7.2,
        damagedAmount: 240000,
        totalEstimatedLossAmount: 240000,
        rank: 2,
        ranking: 2,
        evaluation: 'Cần nhắc nhở đóng gói thùng xốp chống ngập nước',
        unit: 'kg',
      },
      {
        supplierId: 2,
        supplierCode: 'NCC-TB02',
        supplierName: 'Thịt Bò Nhập Khẩu Vissan',
        reportCount: 0,
        importedQuantity: 100.0,
        totalPurchasedQty: 100.0,
        damagedQuantity: 0.0,
        totalDamagedQty: 0.0,
        lossRate: 0.0,
        damageRatePercentage: 0.0,
        damagedAmount: 0,
        totalEstimatedLossAmount: 0,
        rank: 3,
        ranking: 3,
        evaluation: 'Chất lượng xuất sắc (0% lỗi)',
        unit: 'kg',
      },
    ];
  },

  exportSupplierLossExcel: async (params?: {
    month?: number;
    year?: number;
    branchId?: number;
    itemId?: number;
  }): Promise<Blob> => {
    await simulateLatency(80, 120);
    const data = await warehouseApi.getSupplierLossReport(params);

    const wb = XLSX.utils.book_new();
    const header = [
      'Xếp hạng',
      'Mã NCC',
      'Tên Nhà Cung Cấp',
      'Số lần giao lỗi',
      'Tổng lượng nhập (kg)',
      'Tổng lượng hỏng (kg)',
      'Tỷ lệ hỏng (%)',
      'Tổng tiền thiệt hại (đ)',
      'Đánh giá chất lượng',
    ];

    const rows = data.map((d) => [
      d.rank || 1,
      d.supplierCode,
      d.supplierName,
      d.reportCount || 0,
      d.totalPurchasedQty || 0,
      d.totalDamagedQty || 0,
      `${d.damageRatePercentage}%`,
      d.totalEstimatedLossAmount || 0,
      d.evaluation,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'BaoCaoTyLeHongNCC');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    return new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },

  // --- Bảng tổng hợp công nợ NCC & Khấu trừ cân thiếu (TASK-S4-02) ---
  getSupplierDebtSummary: async (params?: {
    branchId?: number;
    month?: string;
  }): Promise<SupplierDebtSummary[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const suppliers = await db.suppliers.toArray();
    const documents = await db.warehouseDocuments.toArray();
    const importDocs = documents.filter((d) => d.docType === 'NHAP');

    const map = new Map<number, SupplierDebtSummary>();

    for (const sup of suppliers) {
      map.set(sup.id, {
        supplierId: sup.id,
        supplierCode: sup.supplierCode,
        supplierName: sup.supplierName,
        phone: sup.phone,
        address: sup.address,
        branchId: params?.branchId || 1,
        totalInvoicesCount: 0,
        totalReportedWeight: 0,
        totalActualWeight: 0,
        totalWeightDiff: 0,
        totalReportedAmount: 0,
        totalShortageDeduction: 0,
        finalPayableDebt: 0,
        disputeStatus: 'KHOP_DU',
      });
    }

    for (const doc of importDocs) {
      if (!doc.supplierId) continue;
      let summary = map.get(doc.supplierId);
      if (!summary) {
        summary = {
          supplierId: doc.supplierId,
          supplierCode: doc.supplierCode || 'NCC-UNKNOWN',
          supplierName: doc.supplierName || 'Nhà Cung Cấp',
          branchId: doc.branchId || 1,
          totalInvoicesCount: 0,
          totalReportedWeight: 0,
          totalActualWeight: 0,
          totalWeightDiff: 0,
          totalReportedAmount: 0,
          totalShortageDeduction: 0,
          finalPayableDebt: 0,
          disputeStatus: 'KHOP_DU',
        };
        map.set(doc.supplierId, summary);
      }

      summary.totalInvoicesCount += 1;
      summary.lastImportDate = doc.createdAt.slice(0, 10);

      for (const it of doc.items || []) {
        const repW = it.supplierReportedWeight ?? it.quantity;
        const actW = it.actualWeight ?? it.quantity;
        const diff = it.weightDiff !== undefined ? it.weightDiff : Number((actW - repW).toFixed(2));
        const shortage =
          it.shortageAmount !== undefined
            ? it.shortageAmount
            : diff < 0
            ? Math.round(Math.abs(diff) * it.unitPrice)
            : 0;

        summary.totalReportedWeight = Number((summary.totalReportedWeight + repW).toFixed(2));
        summary.totalActualWeight = Number((summary.totalActualWeight + actW).toFixed(2));
        summary.totalWeightDiff = Number((summary.totalWeightDiff + diff).toFixed(2));
        summary.totalReportedAmount += repW * it.unitPrice;
        summary.totalShortageDeduction += shortage;
      }
      summary.finalPayableDebt = Math.max(
        0,
        summary.totalReportedAmount - summary.totalShortageDeduction
      );
      summary.disputeStatus = summary.totalShortageDeduction > 0 ? 'LECH_CAN_THIEU' : 'KHOP_DU';
    }

    // Nạp baseline thực tế từ sheet NCC Thái Nguyên & Quế Võ nếu chưa có phiếu cân mới
    const list = Array.from(map.values()).map((s) => {
      if (s.totalInvoicesCount === 0) {
        if (s.supplierCode === 'TNCOTHUY' || s.supplierCode === 'NCC-RC03') {
          return {
            ...s,
            totalInvoicesCount: 8,
            totalReportedWeight: 420.5,
            totalActualWeight: 405.0,
            totalWeightDiff: -15.5,
            totalReportedAmount: 45438000,
            totalShortageDeduction: 1860000,
            finalPayableDebt: 43578000,
            disputeStatus: 'LECH_CAN_THIEU' as const,
            lastImportDate: '2026-11-18',
          };
        }
        if (s.supplierCode === 'TNANHTHO' || s.supplierCode === 'NCC-TB02') {
          return {
            ...s,
            totalInvoicesCount: 12,
            totalReportedWeight: 680.0,
            totalActualWeight: 662.5,
            totalWeightDiff: -17.5,
            totalReportedAmount: 56328000,
            totalShortageDeduction: 2450000,
            finalPayableDebt: 53878000,
            disputeStatus: 'LECH_CAN_THIEU' as const,
            lastImportDate: '2026-11-18',
          };
        }
        if (s.supplierCode === 'TNHUYENHS' || s.supplierCode === 'NCC-HS01') {
          return {
            ...s,
            totalInvoicesCount: 6,
            totalReportedWeight: 185.0,
            totalActualWeight: 178.2,
            totalWeightDiff: -6.8,
            totalReportedAmount: 23805000,
            totalShortageDeduction: 1496000,
            finalPayableDebt: 22309000,
            disputeStatus: 'LECH_CAN_THIEU' as const,
            lastImportDate: '2026-11-18',
          };
        }
        if (s.supplierCode === 'TNTHANHHIEP') {
          return {
            ...s,
            totalInvoicesCount: 15,
            totalReportedWeight: 890.0,
            totalActualWeight: 871.0,
            totalWeightDiff: -19.0,
            totalReportedAmount: 98647000,
            totalShortageDeduction: 4180000,
            finalPayableDebt: 94467000,
            disputeStatus: 'LECH_CAN_THIEU' as const,
            lastImportDate: '2026-11-18',
          };
        }
      }
      return s;
    });

    return list;
  },

  exportSupplierDebtExcel: async (params?: {
    branchId?: number;
    month?: string;
  }): Promise<Blob> => {
    await simulateLatency(80, 120);
    const data = await warehouseApi.getSupplierDebtSummary(params);

    const wb = XLSX.utils.book_new();
    const header = [
      'STT',
      'Mã NCC',
      'Tên Nhà Cung Cấp',
      'Số Phiếu Nhập',
      'Khối Lượng NCC Báo (kg)',
      'Khối Lượng Thực Cân (kg)',
      'Lệch Cân (kg)',
      'Tiền Hàng NCC Báo (đ)',
      'Trừ Tiền Cân Thiếu (đ)',
      'Công Nợ Thực Trả Cuối Tháng (đ)',
      'Trạng Thái Đối Soát',
    ];

    const rows = data.map((d, idx) => [
      idx + 1,
      d.supplierCode,
      d.supplierName,
      d.totalInvoicesCount,
      d.totalReportedWeight,
      d.totalActualWeight,
      d.totalWeightDiff,
      d.totalReportedAmount,
      d.totalShortageDeduction,
      d.finalPayableDebt,
      d.disputeStatus === 'LECH_CAN_THIEU' ? '⚠️ CÂN THIẾU (ĐÃ TRỪ TIỀN)' : '✓ ĐỦ KHỐI LƯỢNG',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'CongNo_NCC_CuoiThang');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    return new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },

  // --- Realtime Item Stock (Tồn kho khả dụng) ---
  getItemCurrentStock: async (itemId: number, branchCodeOrId?: string | number): Promise<number> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(60, 100);

    let targetBranchId: number | undefined;
    let targetBranchCode: string | undefined;

    if (typeof branchCodeOrId === 'number') {
      targetBranchId = branchCodeOrId;
      targetBranchCode = branchCodeOrId === 1 ? 'TN' : branchCodeOrId === 2 ? 'QV' : undefined;
    } else if (typeof branchCodeOrId === 'string') {
      targetBranchCode = branchCodeOrId.toUpperCase();
      targetBranchId = targetBranchCode === 'TN' ? 1 : targetBranchCode === 'QV' ? 2 : undefined;
    }

    let lots = await db.inventoryLots.where('itemId').equals(itemId).toArray();
    if (targetBranchId) {
      lots = lots.filter(
        (l) =>
          !l.branchId ||
          l.branchId === targetBranchId ||
          (targetBranchCode && l.branchCode === targetBranchCode)
      );
    }
    const total = lots.reduce((sum, l) => sum + (Number(l.currentStock) || 0), 0);
    return Number(total.toFixed(2));
  },

  // --- Thẻ Kho Tức Thời (Realtime Stock Ledger) ---
  getStockLedger: async (
    itemId: number,
    branchCodeOrId?: string | number
  ): Promise<StockLedgerEntry[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    let targetBranchId: number | undefined;
    let targetBranchCode: string | undefined;

    if (typeof branchCodeOrId === 'number') {
      targetBranchId = branchCodeOrId;
      targetBranchCode = branchCodeOrId === 1 ? 'TN' : branchCodeOrId === 2 ? 'QV' : undefined;
    } else if (typeof branchCodeOrId === 'string') {
      targetBranchCode = branchCodeOrId.toUpperCase();
      targetBranchId = targetBranchCode === 'TN' ? 1 : targetBranchCode === 'QV' ? 2 : undefined;
    }

    const item = await db.items.get(itemId);
    const itemName = item?.itemName || 'Nguyên liệu';
    const itemCode = item?.itemCode || 'M-01';
    const unit = item?.unit || 'kg';

    const rawEvents: {
      id: number | string;
      docCode: string;
      docType: 'NHAP' | 'XUAT_BEP' | 'XUAT_HUY' | 'KIEM_KE' | string;
      docTypeName: string;
      date: string;
      batchCode?: string;
      inQty: number;
      outQty: number;
      changeQty: number;
      performer?: string;
      note?: string;
      partnerOrReason?: string;
    }[] = [];

    // 1. Từ Phiếu kho (warehouseDocuments)
    const docs = await db.warehouseDocuments.toArray();
    for (const doc of docs) {
      if (targetBranchId && doc.branchId && doc.branchId !== targetBranchId) continue;

      const matchingItems = (doc.items || []).filter((it: any) => it.itemId === itemId);
      for (const it of matchingItems) {
        const qty = it.actualWeight !== undefined ? it.actualWeight : it.quantity;
        if (doc.docType === 'NHAP') {
          rawEvents.push({
            id: `DOC-${doc.id}-${it.id || 0}`,
            docCode: doc.docCode || `PNK-${doc.id}`,
            docType: 'NHAP',
            docTypeName: '📥 Nhập kho NCC',
            date: doc.createdAt || '2026-11-16 08:00:00',
            batchCode: it.batchCode,
            inQty: qty,
            outQty: 0,
            changeQty: qty,
            performer: doc.createdByName || doc.createdBy || 'Lê Hoàng (Thủ kho)',
            partnerOrReason: doc.supplierName || doc.supplierCode || 'Nhà cung cấp',
            note: doc.note || `Nhập hàng từ ${doc.supplierName || 'NCC'}`,
          });
        } else if (doc.docType === 'HUY' || doc.docType === 'XUAT_HUY') {
          rawEvents.push({
            id: `DOC-${doc.id}-${it.id || 0}`,
            docCode: doc.docCode || `PHK-${doc.id}`,
            docType: 'XUAT_HUY',
            docTypeName: '🗑️ Xuất hủy kho',
            date: doc.createdAt || '2026-11-18 10:00:00',
            batchCode: it.batchCode,
            inQty: 0,
            outQty: qty,
            changeQty: -qty,
            performer: doc.createdByName || doc.createdBy || 'Lê Hoàng (Quản lý duyệt)',
            partnerOrReason: it.reason || doc.note || 'Xuất hủy hao hụt',
            note: doc.note || 'Phiếu xuất hủy',
          });
        } else if (doc.docType === 'XUAT_CHE_BIEN') {
          rawEvents.push({
            id: `DOC-${doc.id}-${it.id || 0}`,
            docCode: doc.docCode || `PXK-CB-${doc.id}`,
            docType: 'XUAT_CHE_BIEN',
            docTypeName: '🍳 Xuất bếp nấu line',
            date: doc.createdAt || '2026-11-17 09:00:00',
            batchCode: it.batchCode,
            inQty: 0,
            outQty: qty,
            changeQty: -qty,
            performer: doc.createdByName || doc.createdBy || 'NV: bep_tn',
            partnerOrReason: it.reason || doc.note || 'Bếp lấy nguyên liệu chế biến',
            note: doc.note || 'Xuất chế biến bếp',
          });
        } else if (doc.docType === 'NHAP_BTP') {
          rawEvents.push({
            id: `DOC-${doc.id}-${it.id || 0}`,
            docCode: doc.docCode || `PNK-BTP-${doc.id}`,
            docType: 'NHAP',
            docTypeName: '📥 Nhập BTP từ mẻ nấu',
            date: doc.createdAt || '2026-11-17 10:00:00',
            batchCode: it.batchCode,
            inQty: qty,
            outQty: 0,
            changeQty: qty,
            performer: doc.createdByName || doc.createdBy || 'Bếp viên',
            partnerOrReason: it.reason || doc.note || 'Hoàn tất mẻ nấu',
            note: doc.note || 'Tự động tăng tồn kho bán thành phẩm',
          });
        } else if (doc.docType === 'RA_LINE') {
          rawEvents.push({
            id: `DOC-${doc.id}-${it.id || 0}`,
            docCode: doc.docCode || `PXK-LINE-${doc.id}`,
            docType: 'RA_LINE',
            docTypeName: '🍽️ Ra quầy line phục vụ',
            date: doc.createdAt || '2026-11-17 11:00:00',
            batchCode: it.batchCode,
            inQty: 0,
            outQty: qty,
            changeQty: -qty,
            performer: doc.createdByName || doc.createdBy || 'Bếp viên',
            partnerOrReason: 'Quầy line buffet',
            note: doc.note || 'Xuất quầy line buffet',
          });
        } else if (doc.docType === 'XUAT_CHUYEN' || doc.docType === 'XUAT_BEP') {
          rawEvents.push({
            id: `DOC-${doc.id}-${it.id || 0}`,
            docCode: doc.docCode || `PXK-${doc.id}`,
            docType: 'XUAT_BEP',
            docTypeName: '🍳 Xuất bếp nấu line',
            date: doc.createdAt || '2026-11-17 09:00:00',
            batchCode: it.batchCode,
            inQty: 0,
            outQty: qty,
            changeQty: -qty,
            performer: doc.createdByName || doc.createdBy || 'Nguyễn Văn Bếp',
            partnerOrReason: doc.note || 'Xuất bếp chế biến',
            note: doc.note || 'Xuất kho cho bếp',
          });
        } else if (doc.docType === 'XUAT_CHUYEN_NOI_BO') {
          rawEvents.push({
            id: `DOC-${doc.id}-${it.id || 0}`,
            docCode: doc.docCode || `PXK-${doc.id}`,
            docType: 'XUAT_CHUYEN_NOI_BO',
            docTypeName: '📦 Xuất chuyển nội bộ (Kho khô ➔ Bếp)',
            date: doc.createdAt || '2026-11-17 09:00:00',
            batchCode: it.batchCode,
            inQty: 0,
            outQty: qty,
            changeQty: -qty,
            performer: doc.createdByName || doc.createdBy || 'Nguyễn Văn Bếp',
            partnerOrReason: doc.note || 'Chuyển Kho Khô sang Kho Bếp',
            note: doc.note || 'Xuất chuyển nội bộ',
          });
        }
      }
    }

    // 2. Từ takeOutLogs (Bếp lấy nguyên liệu từ kho nếu chưa có trong warehouseDocuments)
    const existingDocCodes = new Set(rawEvents.map((e) => e.docCode));
    const takeOuts = await db.takeOutLogs.toArray();
    for (const log of takeOuts) {
      if (targetBranchId && log.branchId && log.branchId !== targetBranchId) continue;
      const logItemId = log.item?.id || log.itemId;
      const expectedCode = log.docCode || `PXK-CB-${log.id}`;
      // Tránh trùng lặp với warehouseDocuments đã add ở trên
      const isAlreadyIncluded =
        existingDocCodes.has(expectedCode) ||
        (log.docCode && existingDocCodes.has(log.docCode)) ||
        rawEvents.some(
          (e) =>
            e.docType === 'XUAT_CHE_BIEN' &&
            Math.abs(e.outQty - log.quantity) < 0.001 &&
            (e.date === log.createdAt || e.docCode.includes(String(log.id)))
        );

      if (logItemId === itemId && !log.isCancelled && !isAlreadyIncluded) {
        const rawPerf = log.performer || log.staffName || log.createdByName || log.createdBy || 'bep_tn';
        const perf = rawPerf.startsWith('NV:') ? rawPerf : `NV: ${rawPerf}`;
        rawEvents.push({
          id: `TO-${log.id}`,
          docCode: expectedCode,
          docType: 'XUAT_CHE_BIEN',
          docTypeName: '🍳 Xuất bếp nấu line',
          date: log.createdAt || '2026-11-18 11:30:00',
          inQty: 0,
          outQty: log.quantity,
          changeQty: -log.quantity,
          performer: perf,
          partnerOrReason: 'Khu vực bếp ra line',
          note: log.note || 'Bếp lấy hàng chế biến ca',
        });
        existingDocCodes.add(expectedCode);
      }
    }

    // 3. Từ inventoryChecks (Kiểm kê định kỳ)
    const checks = await db.inventoryChecks.toArray();
    for (const check of checks) {
      if (targetBranchId && check.branchId && check.branchId !== targetBranchId) continue;

      const matchingItems = (check.items || []).filter((it: any) => it.itemId === itemId);
      for (const it of matchingItems) {
        const diff =
          it.difference !== undefined ? it.difference : it.actualStock - (it.systemStock || 0);
        rawEvents.push({
          id: `CHK-${check.id}-${it.id || 0}`,
          docCode: check.checkCode || `KK-${check.id}`,
          docType: 'KIEM_KE',
          docTypeName: `🔍 Điều chỉnh kiểm kê (${check.shift || 'Định kỳ'})`,
          date:
            check.createdAt ||
            (check.checkDate ? `${check.checkDate} 12:00:00` : '2026-11-18 12:00:00'),
          inQty: diff > 0 ? diff : 0,
          outQty: diff < 0 ? Math.abs(diff) : 0,
          changeQty: diff,
          performer: check.checkedByName || check.checkedBy || 'Lê Hoàng & Nguyễn Bá Hoan',
          partnerOrReason:
            it.reason || check.note || (diff < 0 ? 'Thất thoát / hao hụt ca' : 'Khớp số liệu'),
          note: check.note || 'Biên bản kiểm kê kho',
        });
      }
    }

    // 4. Nếu chưa có sự kiện nhập ban đầu nào cho itemId từ warehouseDocuments, kiểm tra inventoryLots
    const docBatchCodes = new Set(rawEvents.map((e) => e.batchCode).filter(Boolean));
    const lots = await db.inventoryLots.where('itemId').equals(itemId).toArray();
    for (const lot of lots) {
      if (targetBranchId && lot.branchId && lot.branchId !== targetBranchId) continue;
      if (!docBatchCodes.has(lot.batchCode)) {
        rawEvents.push({
          id: `LOT-INIT-${lot.id}`,
          docCode: lot.batchCode || `PNK-INIT-${lot.id}`,
          docType: 'NHAP',
          docTypeName: '📥 Nhập kho ban đầu',
          date: lot.importDate ? `${lot.importDate} 07:00:00` : '2026-11-15 07:00:00',
          batchCode: lot.batchCode,
          inQty: lot.initialQuantity || lot.currentStock || 0,
          outQty: 0,
          changeQty: lot.initialQuantity || lot.currentStock || 0,
          performer: lot.createdByName || lot.createdBy || 'Lê Hoàng (Thủ kho)',
          partnerOrReason: lot.supplierName || lot.supplierCode || 'Nhà cung cấp',
          note: `Lô nhập ${lot.batchCode} - HSD: ${lot.expiryDate || 'N/A'}`,
        });
      }
    }

    // Sắp xếp theo ngày tăng dần để tính lũy kế tồn kho (balance)
    rawEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const ledgerEntries: StockLedgerEntry[] = rawEvents.map((evt) => {
      runningBalance += evt.changeQty;
      return {
        id: evt.id,
        docCode: evt.docCode,
        docType: evt.docType,
        docTypeName: evt.docTypeName,
        date: evt.date,
        itemId,
        itemCode,
        itemName,
        batchCode: evt.batchCode,
        inQty: Number(evt.inQty.toFixed(2)),
        outQty: Number(evt.outQty.toFixed(2)),
        changeQty: Number(evt.changeQty.toFixed(2)),
        balance: Number(runningBalance.toFixed(2)),
        unit,
        performer: evt.performer || 'NV: bep_tn',
        partnerOrReason: evt.partnerOrReason,
        note: evt.note,
        branchCode: targetBranchCode || 'TN',
      };
    });

    return ledgerEntries.reverse();
  },

  // --- Điều Chỉnh & Đối Chiếu Công Nợ NCC (Debt Adjustments & Period Closing) ---
  getDebtAdjustments: async (
    supplierId?: number,
    branchCodeOrId?: string | number
  ): Promise<DebtAdjustment[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    let targetBranchCode: string | undefined;
    if (typeof branchCodeOrId === 'number') {
      targetBranchCode = branchCodeOrId === 1 ? 'TN' : branchCodeOrId === 2 ? 'QV' : undefined;
    } else if (typeof branchCodeOrId === 'string') {
      targetBranchCode = branchCodeOrId.toUpperCase();
    }

    let list = await db.debtAdjustments.toArray();
    if (supplierId) {
      list = list.filter((a) => a.supplierId === supplierId);
    }
    if (targetBranchCode) {
      list = list.filter((a) => !a.branchCode || a.branchCode.toUpperCase() === targetBranchCode);
    }
    return list.reverse();
  },

  createDebtAdjustment: async (data: CreateDebtAdjustmentRequest): Promise<DebtAdjustment> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 160);

    const supplier = await db.suppliers.get(data.supplierId);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newAdj: DebtAdjustment = {
      id: Date.now(),
      supplierId: data.supplierId,
      supplierCode: supplier?.supplierCode || 'NCC-UNKNOWN',
      supplierName: supplier?.supplierName || 'Nhà cung cấp',
      branchCode: (data.branchCode || 'TN').toUpperCase(),
      periodId: data.periodId,
      periodStartDate: data.periodStartDate || new Date().toISOString().slice(0, 10),
      periodEndDate: data.periodEndDate || new Date().toISOString().slice(0, 10),
      totalReportedWeight: data.totalReportedWeight || 0,
      totalActualWeight: data.totalActualWeight || 0,
      weightDiff: data.weightDiff || 0,
      shortageAmount: data.shortageAmount || 0,
      adjustmentAmount: data.adjustmentAmount,
      reason: data.reason,
      status: data.status || 'CHO_DUYET',
      adjustedBy: data.adjustedBy || 'Kế toán trưởng',
      createdAt: now,
    };

    await db.debtAdjustments.add(newAdj);
    return newAdj;
  },

  closeDebtPeriod: async (
    periodId: number
  ): Promise<{ success: boolean; message: string; period?: any }> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 150);

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    let updatedPeriod = await db.reconciliationPeriods.get(periodId);
    let updatedAdjustment = await db.debtAdjustments.get(periodId);

    if (updatedPeriod) {
      await db.reconciliationPeriods.update(periodId, {
        status: 'DA_CHOT',
        closedAt: now,
      });
      await db.debtAdjustments
        .where('periodId')
        .equals(periodId)
        .modify({ status: 'DA_CHOT', closedAt: now });
      updatedPeriod = await db.reconciliationPeriods.get(periodId);
      return {
        success: true,
        message: `Đã chốt kỳ đối soát công nợ #${periodId} thành công`,
        period: updatedPeriod,
      };
    }

    if (updatedAdjustment) {
      await db.debtAdjustments.update(periodId, {
        status: 'DA_CHOT',
        closedAt: now,
      });
      updatedAdjustment = await db.debtAdjustments.get(periodId);
      return {
        success: true,
        message: `Đã chốt phiếu điều chỉnh công nợ #${periodId} thành công`,
        period: updatedAdjustment,
      };
    }

    // Nếu periodId chưa có trong bảng reconciliationPeriods, tạo mới bản ghi đã chốt
    const newPeriod: ReconciliationPeriod = {
      id: periodId,
      supplierId: 1,
      supplierCode: 'NCC-HS01',
      supplierName: 'Công ty Hải Sản Biển Đông',
      branchCode: 'TN',
      periodStartDate: '2026-11-11',
      periodEndDate: '2026-11-20',
      totalReportedWeight: 0,
      totalActualWeight: 0,
      weightDiff: 0,
      shortageAmount: 0,
      adjustmentAmount: 0,
      status: 'DA_CHOT',
      adjustedBy: 'Kế toán trưởng',
      createdAt: now,
      closedAt: now,
    };
    await db.reconciliationPeriods.add(newPeriod);
    return {
      success: true,
      message: `Đã chốt kỳ đối soát công nợ #${periodId} thành công`,
      period: newPeriod,
    };
  },

  getReconciliationPeriods: async (
    supplierId?: number,
    branchCodeOrId?: string | number
  ): Promise<ReconciliationPeriod[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    let targetBranchCode: string | undefined;
    if (typeof branchCodeOrId === 'number') {
      targetBranchCode = branchCodeOrId === 1 ? 'TN' : branchCodeOrId === 2 ? 'QV' : undefined;
    } else if (typeof branchCodeOrId === 'string') {
      targetBranchCode = branchCodeOrId.toUpperCase();
    }

    let list = await db.reconciliationPeriods.toArray();
    if (supplierId) {
      list = list.filter((p) => p.supplierId === supplierId);
    }
    if (targetBranchCode) {
      list = list.filter((p) => !p.branchCode || p.branchCode.toUpperCase() === targetBranchCode);
    }
    return list.reverse();
  },

  createReconciliationPeriod: async (
    data: Partial<ReconciliationPeriod> & { supplierId: number }
  ): Promise<ReconciliationPeriod> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 160);

    const supplier = await db.suppliers.get(data.supplierId);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newPeriod: ReconciliationPeriod = {
      id: data.id || Date.now(),
      supplierId: data.supplierId,
      supplierCode: data.supplierCode || supplier?.supplierCode || 'NCC-UNKNOWN',
      supplierName: data.supplierName || supplier?.supplierName || 'Nhà cung cấp',
      branchCode: (data.branchCode || 'TN').toUpperCase(),
      periodStartDate: data.periodStartDate || new Date().toISOString().slice(0, 10),
      periodEndDate: data.periodEndDate || new Date().toISOString().slice(0, 10),
      totalReportedWeight: data.totalReportedWeight || 0,
      totalActualWeight: data.totalActualWeight || 0,
      weightDiff: data.weightDiff || 0,
      shortageAmount: data.shortageAmount || 0,
      adjustmentAmount: data.adjustmentAmount || 0,
      finalPayableDebt: data.finalPayableDebt || 0,
      reason: data.reason || 'Kỳ đối soát công nợ định kỳ',
      status: data.status || 'CHO_DUYET',
      adjustedBy: data.adjustedBy || 'Kế toán trưởng',
      createdAt: now,
    };

    await db.reconciliationPeriods.add(newPeriod);
    return newPeriod;
  },

  // =========================================================================
  // MÔ HÌNH KHO 2 TẦNG (TASK-FLOW-01 & DUAL INVENTORY OPERATIONS)
  // =========================================================================

  /**
   * Danh sách 11 Nhóm Danh Mục Quy Chuẩn Cho Kho Trước Chế Biến
   */
  getPreProcessingCategories: (): PreProcessingCategoryMeta[] => {
    return PRE_PROCESSING_CATEGORIES;
  },

  /**
   * Truy vấn tồn kho theo 11 nhóm Kho Trước Chế Biến
   */
  getPreProcessingStocks: async (params?: {
    branchId?: number;
    category?: PreProcessingCategory | string;
    search?: string;
  }): Promise<InventoryStock[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const stocks = await warehouseApi.getStocks({ branchId: params?.branchId });
    const items = await db.items.toArray();
    const itemMap = new Map(items.map((i) => [i.id, i]));

    let filtered = stocks.map((s: InventoryStock) => {
      const it = itemMap.get(s.itemId);
      const preCat = getItemPreProcessingCategory(s.itemCode, it?.category, it?.costGroup, s.itemName);
      return {
        ...s,
        preProcessingCategory: preCat,
      };
    });

    if (params?.category && params.category !== 'ALL') {
      filtered = filtered.filter((s: any) => s.preProcessingCategory === params.category);
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (s: InventoryStock) =>
          s.itemName.toLowerCase().includes(q) ||
          s.itemCode.toLowerCase().includes(q) ||
          (s.batchCode && s.batchCode.toLowerCase().includes(q))
      );
    }

    return filtered;
  },

  // --- KHO SAU CHẾ BIẾN (Processed Dishes / Finished Dishes) ---

  /**
   * Lấy danh sách các món ăn hoàn chỉnh trong Kho Sau Chế Biến theo chi nhánh
   */
  getProcessedDishes: async (params?: {
    branchId?: number;
    category?: string;
    search?: string;
  }): Promise<ProcessedDish[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(60, 100);

    let list = await db.processedDishes.toArray();

    if (params?.branchId) {
      list = list.filter((d) => !d.branchId || d.branchId === params.branchId);
    }

    if (params?.category && params.category !== 'ALL') {
      const cat = params.category.toLowerCase();
      list = list.filter((d) => d.category.toLowerCase().includes(cat));
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.dishName.toLowerCase().includes(q) ||
          d.dishCode.toLowerCase().includes(q)
      );
    }

    return list;
  },

  /**
   * Lấy chi tiết món ăn hoàn chỉnh theo ID
   */
  getProcessedDishById: async (id: number): Promise<ProcessedDish | null> => {
    await initializeDatabaseIfEmpty();
    const dish = await db.processedDishes.get(id);
    return dish || null;
  },

  /**
   * Lấy món hoàn chỉnh liên kết với nguyên liệu thô đầu vào
   */
  getProcessedDishByRawItemId: async (
    rawItemId: number,
    branchId?: number
  ): Promise<ProcessedDish | null> => {
    await initializeDatabaseIfEmpty();
    let query = db.processedDishes.where('rawItemId').equals(rawItemId);
    const results = await query.toArray();
    if (branchId) {
      return results.find((d) => d.branchId === branchId) || results[0] || null;
    }
    return results[0] || null;
  },

  /**
   * Tăng tồn kho Kho Sau Chế Biến khi hoàn thành Cân Mẻ Chế Biến (Nút 2 Bếp)
   */
  addProcessedDishStock: async (params: {
    dishId?: number;
    dishCode?: string;
    rawItemId?: number;
    branchId: number;
    quantity: number;
    unit?: string;
  }): Promise<ProcessedDish> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    let dish: ProcessedDish | undefined;

    if (params.dishId) {
      dish = await db.processedDishes.get(params.dishId);
    } else if (params.dishCode) {
      dish = await db.processedDishes
        .where('dishCode')
        .equals(params.dishCode)
        .filter((d) => !params.branchId || d.branchId === params.branchId)
        .first();
    } else if (params.rawItemId) {
      dish = await db.processedDishes
        .where('rawItemId')
        .equals(params.rawItemId)
        .filter((d) => !params.branchId || d.branchId === params.branchId)
        .first();
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (dish) {
      const newQty = Number(((dish.quantity || 0) + params.quantity).toFixed(2));
      await db.processedDishes.update(dish.id, {
        quantity: newQty,
        status: newQty > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
        lastUpdatedAt: now,
      });
      const updated = await db.processedDishes.get(dish.id);
      return updated!;
    } else {
      // Tự động tạo món mới trong kho sau chế biến nếu chưa tồn tại
      const rawItem = params.rawItemId ? await db.items.get(params.rawItemId) : null;
      const newDish: ProcessedDish = {
        id: Date.now(),
        dishCode: params.dishCode || `DISH-${Date.now().toString().slice(-4)}`,
        dishName: rawItem ? `${rawItem.itemName} chế biến` : 'Món chế biến mới',
        category: 'Món Nóng',
        rawItemId: params.rawItemId,
        rawItemCode: rawItem?.itemCode,
        rawItemName: rawItem?.itemName,
        branchId: params.branchId,
        branchCode: params.branchId === 2 ? 'QV' : 'TN',
        quantity: Number(params.quantity.toFixed(2)),
        unit: params.unit || 'đĩa',
        status: 'AVAILABLE',
        lastUpdatedAt: now,
      };
      await db.processedDishes.add(newDish);
      return newDish;
    }
  },

  /**
   * Khấu trừ tồn kho Kho Sau Chế Biến khi bấm Ra Line (+1 hoặc nhập đĩa) (Nút 3 Bếp)
   * Chặn cứng nếu số lượng yêu cầu vượt quá tồn khả dụng trong Kho Sau Chế Biến!
   */
  deductProcessedDishStock: async (params: {
    dishId?: number;
    dishCode?: string;
    rawItemId?: number;
    branchId: number;
    quantity: number;
  }): Promise<{ success: boolean; dish: ProcessedDish; remainingStock: number }> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    let dish: ProcessedDish | undefined;

    if (params.dishId) {
      dish = await db.processedDishes.get(params.dishId);
    } else if (params.dishCode) {
      dish = await db.processedDishes
        .where('dishCode')
        .equals(params.dishCode)
        .filter((d) => !params.branchId || d.branchId === params.branchId)
        .first();
    } else if (params.rawItemId) {
      dish = await db.processedDishes
        .where('rawItemId')
        .equals(params.rawItemId)
        .filter((d) => !params.branchId || d.branchId === params.branchId)
        .first();
    }

    if (!dish) {
      throw new Error('Không tìm thấy món ăn trong Kho Sau Chế Biến!');
    }

    if ((dish.quantity || 0) < params.quantity) {
      throw new Error(
        `Số lượng yêu cầu (${params.quantity} ${dish.unit}) vượt quá tồn kho thành phẩm (${dish.quantity} ${dish.unit}). Kho sau chế biến không đủ món để ra line!`
      );
    }

    const remaining = Number((dish.quantity - params.quantity).toFixed(2));
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    await db.processedDishes.update(dish.id, {
      quantity: remaining,
      status: remaining <= 0 ? 'OUT_OF_STOCK' : 'AVAILABLE',
      lastUpdatedAt: now,
    });

    const updated = await db.processedDishes.get(dish.id);
    return {
      success: true,
      dish: updated!,
      remainingStock: remaining,
    };
  },

  /**
   * Tạo món ăn mới trong Kho Sau Chế Biến
   */
  createProcessedDish: async (data: Partial<ProcessedDish>): Promise<ProcessedDish> => {
    await initializeDatabaseIfEmpty();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newDish: ProcessedDish = {
      id: data.id || Date.now(),
      dishCode: data.dishCode || `DISH-${Date.now().toString().slice(-4)}`,
      dishName: data.dishName || 'Món ăn mới',
      category: data.category || 'Món Nóng',
      rawItemId: data.rawItemId,
      rawItemCode: data.rawItemCode,
      rawItemName: data.rawItemName,
      branchId: data.branchId || 1,
      branchCode: data.branchCode || (data.branchId === 2 ? 'QV' : 'TN'),
      quantity: data.quantity || 0,
      unit: data.unit || 'đĩa',
      standardPortionWeight: data.standardPortionWeight,
      costPrice: data.costPrice,
      status: (data.quantity || 0) > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
      lastUpdatedAt: now,
    };
    await db.processedDishes.add(newDish);
    return newDish;
  },

  /**
   * Cập nhật thông tin món ăn trong Kho Sau Chế Biến
   */
  updateProcessedDish: async (id: number, data: Partial<ProcessedDish>): Promise<ProcessedDish> => {
    await initializeDatabaseIfEmpty();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await db.processedDishes.update(id, {
      ...data,
      lastUpdatedAt: now,
      status:
        data.quantity !== undefined
          ? data.quantity > 0
            ? 'AVAILABLE'
            : 'OUT_OF_STOCK'
          : data.status,
    });
    const updated = await db.processedDishes.get(id);
    if (!updated) throw new Error('Không tìm thấy món ăn trong Kho Sau Chế Biến');
    return updated;
  },
};
