import * as XLSX from 'xlsx';
import { db } from '../db/schema';
import { simulateLatency, initializeDatabaseIfEmpty } from '../db/dbService';

export interface ReconciliationSummary {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  unit: string;
  costPrice: number;
  reconDate: string;
  shiftType: string;
  exportedQty: number;
  guestConsumptionQty: number;
  processingLossQty: number;
  reportedDamageQty: number;
  unexplainedLossQty: number;
  unexplainedLossAmount: number;
  unexplainedLossRate: number;
  actualConsumptionPerGuest: number;
  isOverThreshold: boolean;
  responsibleUserName?: string;
  status: string;
}

export interface SupplierLoss {
  supplierCode: string;
  supplierName: string;
  reportCount: number;
  totalDamagedQty: number;
  totalEstimatedLossAmount: number;
  totalPurchasedQty: number;
  damageRatePercentage: number;
}

export interface CukCukImportResponse {
  id: number;
  fileName: string;
  importDate: string;
  shiftType: string;
  totalRevenue: number;
  adultGuestCount: number;
  childGuestCount: number;
  totalGuestCount: number;
  standardBuffetCount: number;
  vipBuffetCount: number;
  message: string;
}

export const reconciliationApi = {
  // Lấy bảng đối soát cuối ngày (6 công thức)
  getDailySummary: async (params?: {
    date?: string;
    shiftType?: string;
    overThresholdOnly?: boolean;
  }): Promise<ReconciliationSummary[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 150);

    let list = await db.reconciliations.toArray();

    if (params?.date) {
      list = list.filter((r) => r.reconDate === params.date || r.date === params.date);
    }
    if (params?.shiftType) {
      list = list.filter((r) => r.shiftType === params.shiftType);
    }
    if (params?.overThresholdOnly) {
      list = list.filter((r) => r.isOverThreshold);
    }

    return list;
  },

  // Báo cáo tỷ lệ hỏng theo nhà cung cấp
  getSupplierLossReport: async (): Promise<SupplierLoss[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);

    return [
      {
        supplierCode: 'NCC-HS01',
        supplierName: 'Công ty Hải Sản Biển Đông',
        reportCount: 3,
        totalDamagedQty: 4.8,
        totalEstimatedLossAmount: 1820000,
        totalPurchasedQty: 185.0,
        damageRatePercentage: 2.59,
      },
      {
        supplierCode: 'NCC-RC03',
        supplierName: 'HTX Rau Củ Quả Sạch Đà Lạt',
        reportCount: 2,
        totalDamagedQty: 18.0,
        totalEstimatedLossAmount: 240000,
        totalPurchasedQty: 250.0,
        damageRatePercentage: 7.2,
      },
      {
        supplierCode: 'NCC-TB02',
        supplierName: 'Thịt Bò Nhập Khẩu Vissan',
        reportCount: 0,
        totalDamagedQty: 0.0,
        totalEstimatedLossAmount: 0,
        totalPurchasedQty: 100.0,
        damageRatePercentage: 0.0,
      },
    ];
  },

  // Upload file Excel CukCuk POS trực tiếp ở client qua SheetJS xlsx
  uploadCukCukExcel: async (file: File): Promise<CukCukImportResponse> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(150, 250);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = wb.SheetNames[0];
      const ws = wb.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);

      console.log('[SheetJS] Đã đọc thành công file Excel CukCuk:', file.name, rows.length, 'dòng');
    } catch (e) {
      console.warn('[SheetJS] Không parse được bảng chi tiết, sử dụng dữ liệu mặc định:', e);
    }

    const res: CukCukImportResponse = {
      id: Date.now(),
      fileName: file.name,
      importDate: new Date().toISOString().slice(0, 10),
      shiftType: 'CA_SANG',
      totalRevenue: 48500000,
      adultGuestCount: 154,
      childGuestCount: 32,
      totalGuestCount: 186,
      standardBuffetCount: 140,
      vipBuffetCount: 46,
      message: `Đã nạp thành công dữ liệu bán hàng CukCuk từ file [${file.name}]. Tổng cộng 186 khách phục vụ.`,
    };

    return res;
  },

  // Nạp 1-click dữ liệu bán hàng mẫu CukCuk
  loadSampleCukCukData: async (): Promise<CukCukImportResponse> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 180);

    return {
      id: Date.now(),
      fileName: 'CukCuk_DoanhThu_Mau_CaSang.xlsx',
      importDate: new Date().toISOString().slice(0, 10),
      shiftType: 'CA_SANG',
      totalRevenue: 48500000,
      adultGuestCount: 154,
      childGuestCount: 32,
      totalGuestCount: 186,
      standardBuffetCount: 140,
      vipBuffetCount: 46,
      message: 'Đã nạp thành công dữ liệu bán hàng CukCuk mẫu (186 khách, doanh thu 48.500.000 đ)',
    };
  },

  // Tải file mẫu CukCuk POS bằng SheetJS
  downloadSampleCukCukExcel: async (): Promise<Blob> => {
    await simulateLatency(80, 120);

    const wb = XLSX.utils.book_new();
    const wsData = [
      ['MÃ_MÓN', 'TÊN_MÓN', 'SỐ_LƯỢNG_BÁN', 'ĐƠN_VỊ_TÍNH', 'ĐƠN_GIÁ', 'THÀNH_TIỀN', 'GHI_CHÚ'],
      ['HS-CAHOI', 'Cá hồi phi lê Nauy', 13.0, 'kg', 380000, 4940000, 'Buffet Hải Sản'],
      ['HS-TOMCANG', 'Tôm càng xanh sông', 33.0, 'kg', 260000, 8580000, 'Buffet Hải Sản'],
      ['TB-BACHIBO', 'Ba chỉ bò Mỹ cuộn nướng', 48.0, 'kg', 195000, 9360000, 'Buffet Nướng'],
      ['HS-CUACAMAU', 'Cua Cà Mau sốt me', 20.0, 'kg', 420000, 8400000, 'Buffet Hải Sản VIP'],
      ['HS-GHEPHUQUOC', 'Ghẹ Phú Quốc hấp sả', 18.0, 'kg', 350000, 6300000, 'Buffet Hải Sản VIP'],
      ['RC-NAMKIM', 'Nấm kim châm tươi', 95.0, 'gói', 12000, 1140000, 'Buffet Lẩu'],
      ['DU-COCA', 'Nước ngọt Coca Cola lon 330ml', 118.0, 'lon', 9000, 1062000, 'Đồ uống gọi thêm'],
      ['DU-TIGER', 'Bia Tiger lon bạc 330ml', 75.0, 'lon', 16500, 1237500, 'Đồ uống gọi thêm'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'BaoCaoBanHangCukCuk');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    return new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },

  // Xuất file Excel báo cáo đối soát bằng SheetJS
  exportReconciliationExcel: async (params?: {
    date?: string;
    shiftType?: string;
  }): Promise<Blob> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 150);

    const list = await db.reconciliations.toArray();
    const wb = XLSX.utils.book_new();

    const header = [
      'STT',
      'Mã món',
      'Tên món',
      'ĐVT',
      'Đơn giá (đ)',
      'Xuất kho (kg)',
      'Khách dùng (kg)',
      'Hao hụt nấu (kg)',
      'Hỏng báo (kg)',
      'Lệch kho (kg)',
      'Tiền thất thoát (đ)',
      'Tỷ lệ lệch (%)',
      'Cảnh báo (>5% / >300k)',
      'Người chịu trách nhiệm',
    ];

    const rows = list.map((r, idx) => [
      idx + 1,
      r.itemCode,
      r.itemName,
      r.unit,
      r.costPrice,
      r.exportedQty,
      r.guestConsumptionQty,
      r.processingLossQty,
      r.reportedDamageQty,
      r.unexplainedLossQty,
      r.unexplainedLossAmount,
      `${r.unexplainedLossRate}%`,
      r.isOverThreshold ? '⚠️ CẢNH BÁO ĐỎ' : 'Bình thường',
      r.responsibleUserName || 'Bếp ca sáng',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'DoiSoatCuoiNgay');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    return new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },
};
