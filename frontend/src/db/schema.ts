import Dexie, { Table } from 'dexie';

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

export interface Batch {
  id: number;
  batchCode: string;
  branchId?: number;
  itemId: number;
  itemName: string;
  itemCode: string;
  chefName?: string;
  inputWeight: number;
  outputWeight: number | null;
  lossRate: number | null;
  standardLossRate: number;
  overStandard: boolean;
  secondBatch?: boolean;
  status: 'DANG_LAM' | 'HOAN_THANH' | 'HUY' | string;
  startedBy: string;
  finishedBy: string | null;
  startedAt: string;
  finishedAt: string | null;
  warningMessage: string | null;
  scalePhotoUrl?: string;
  rawPhotoUrl?: string;
  approvalStatus?: 'CHO_DUYET' | 'HOP_LE' | 'BIEN_BAN' | string;
  approvalNote?: string;
  approvedBy?: string;
  approvedAt?: string;
}

/**
 * Thực Thể Món Ăn Trong KHO SAU CHẾ BIẾN (Processed Dishes / Finished Dishes)
 * Lưu trữ các món ăn hoàn chỉnh sẵn sàng phục vụ line buffet theo chi nhánh
 */
export interface ProcessedDish {
  id: number;
  dishCode: string;
  dishName: string;
  category: string; // 'Món Nóng' | 'Món Nướng' | 'Món Hấp' | 'Món Lạnh' | 'Tráng Miệng'
  rawItemId?: number;
  rawItemCode?: string;
  rawItemName?: string;
  branchId: number;
  branchCode?: string;
  quantity: number; // Tồn đĩa/kg khả dụng trong kho sau chế biến
  unit: string; // 'đĩa' | 'kg' | 'phần' | 'khay'
  standardPortionWeight?: number; // Khối lượng chuẩn (kg/đĩa)
  costPrice?: number;
  status: 'AVAILABLE' | 'OUT_OF_STOCK' | string;
  lastUpdatedAt?: string;
}

export class SenVietDemoDatabase extends Dexie {
  users!: Table<any, number>;
  branches!: Table<any, number>;
  items!: Table<any, number>;
  recipes!: Table<any, number>;
  batches!: Table<Batch, number>;
  damageReports!: Table<any, number>;
  lineLogs!: Table<any, number>;
  inventoryLots!: Table<any, number>;
  suppliers!: Table<any, number>;
  warehouseDocuments!: Table<any, number>;
  inventoryChecks!: Table<any, number>;
  attendances!: Table<any, number>;
  examQuestions!: Table<any, number>;
  examSubmissions!: Table<any, number>;
  salaryAdvances!: Table<any, number>;
  payrollRecords!: Table<any, number>;
  payrollPeriods!: Table<any, number>;
  salaryIncreaseProposals!: Table<any, number>;
  uniformItems!: Table<any, number>;
  uniformAllocations!: Table<any, number>;
  resignationRequests!: Table<any, number>;
  reconciliations!: Table<any, number>;
  takeOutLogs!: Table<any, number>;
  dailyRemaining!: Table<any, number>;
  dailyMeals!: Table<any, number>;
  debtAdjustments!: Table<any, number>;
  reconciliationPeriods!: Table<any, number>;
  processedDishes!: Table<ProcessedDish, number>;

  constructor() {
    super('SenVietBuffetDemoDB');
    this.version(1).stores({
      users: '++id, username, role, branchId, bankAccount, bankName',
      branches: '++id, code, name',
      items: '++id, itemCode, barcode, itemName, category, costGroup, branchId',
      recipes: '++id, itemId, itemCode',
      batches: '++id, batchCode, branchId, itemId, status, startedAt',
      damageReports: '++id, branchId, itemId, approvalStatus, status, createdAt',
      lineLogs: '++id, branchId, itemId, createdAt',
      inventoryLots: '++id, batchCode, branchId, itemId, supplierId, location, expiryDate',
      suppliers: '++id, supplierCode, supplierName, branchId',
      warehouseDocuments: '++id, docCode, docType, branchId, location, createdAt',
      inventoryChecks: '++id, checkCode, branchId, checkDate',
      attendances: '++id, userId, branchId, attendanceDate, date, isValidLocation, warningLocation',
      examQuestions: '++id, position, type',
      examSubmissions: '++id, userId, branchId, examId, status',
      salaryAdvances: '++id, userId, status, month, deductionMonth',
      payrollRecords: '++id, userId, month, isLocked, bankAccount, bankName',
      payrollPeriods: '++id, periodMonth, branchId, status',
      salaryIncreaseProposals: '++id, branchId, status',
      uniformItems: '++id, itemCode',
      uniformAllocations: '++id, userId, status, isReturned',
      resignationRequests: '++id, userId, branchId, status',
      reconciliations: '++id, branchId, reconDate, date, hasWarning, isOverThreshold',
      takeOutLogs: '++id, itemId, createdAt',
      dailyRemaining: '++id, itemId, branchId',
      dailyMeals: '++id, branchId, branchCode, date, day',
      debtAdjustments: '++id, supplierId, branchCode, periodId, status, createdAt',
      reconciliationPeriods: '++id, supplierId, branchCode, status, periodStartDate, periodEndDate',
      processedDishes: '++id, dishCode, dishName, category, branchId, rawItemId, status',
    });
  }
}

export const db = new SenVietDemoDatabase();
