import { db } from '../db/schema';
import { simulateLatency, initializeDatabaseIfEmpty } from '../db/dbService';

export interface Item {
  id: number;
  itemCode: string;
  barcode: string;
  itemName: string;
  category: string;
  unit: string;
  costPrice: number;
  isBuffetLine: boolean;
  isDailyOnly?: boolean;
  branchId?: number;
  storage?: string;
  minStock?: number;
  maxStock?: number;
}

export interface Recipe {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  unit: string;
  recipeName: string;
  standardLossRate: number;
  description: string;
}

export interface BatchResponse {
  id: number;
  batchCode: string;
  branchId?: number;
  itemId: number;
  itemName: string;
  itemCode: string;
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
  approvalStatus?: 'CHO_DUYET' | 'HOP_LE' | 'BIEN_BAN' | string;
  approvalNote?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export type Batch = BatchResponse;

export interface TakeOutLog {
  id: number;
  branchId?: number;
  itemId?: number;
  item: Item;
  quantity: number;
  unit: string;
  note?: string;
  isCancelled?: boolean;
  status?: 'ACTIVE' | 'CANCELLED';
  cancelledAt?: string;
  createdAt: string;
}

export interface DamageReport {
  id: number;
  item: Item;
  supplierCode?: string;
  batchNumber?: string;
  quantity: number;
  estimatedValue: number;
  reason: string;
  imageUrls?: string;
  status: 'TU_DONG_DUYET' | 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI';
  note?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
}

export interface DailyRemainingItem {
  id: number;
  itemId?: number;
  itemCode: string;
  itemName: string;
  category: string;
  unit: string;
  remainingStock: number;
  suggestedWasteQty?: number;
  isDailyOnly?: boolean;
}

export interface ConfirmDailyWasteRequest {
  shift: string;
  wasteDate?: string;
  note?: string;
  items: {
    itemId: number;
    quantity: number;
    unit: string;
    note?: string;
  }[];
}

export interface QuickAddLineItemRequest {
  itemName: string;
  category: string;
  unit: string;
  costPrice?: number;
  isDailyOnly?: boolean;
}

export const kitchenApi = {
  // Lấy danh sách món quầy buffet
  getBuffetItems: async (): Promise<Item[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);
    const items = await db.items.toArray();
    return items.filter((i) => i.isBuffetLine);
  },

  // Tìm kiếm theo mã hoặc barcode
  searchItems: async (code?: string): Promise<Item[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);
    const all = await db.items.toArray();
    if (!code || !code.trim()) return all;
    const q = code.trim().toLowerCase();
    return all.filter(
      (i) =>
        i.itemCode.toLowerCase().includes(q) ||
        i.barcode.includes(q) ||
        i.itemName.toLowerCase().includes(q)
    );
  },

  // Lấy danh sách công thức & định mức hao hụt chuẩn
  getRecipes: async (): Promise<Recipe[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);
    return await db.recipes.toArray();
  },

  // TASK-LOGIC-01: Lấy tồn kho khả dụng theo lô hàng của chi nhánh (tổng currentStock trong db.inventoryLots)
  getItemAvailableStock: async (itemId: number, branchId?: number): Promise<number> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(40, 80);
    const lots = await db.inventoryLots.where('itemId').equals(itemId).toArray();
    const branchLots = branchId
      ? lots.filter((l) => !l.branchId || l.branchId === branchId)
      : lots;
    const targetLots = branchLots.length > 0 ? branchLots : lots;
    const total = targetLots.reduce((sum, l) => sum + (Number(l.currentStock) || 0), 0);
    return Number(total.toFixed(2));
  },

  // Nút 1: Lấy hàng từ kho (TASK-WH-06 & TASK-LOGIC-01: Chặn vượt tồn, trừ kho thô & Biến động thẻ kho XUẤT_CHẾ_BIẾN)
  recordTakeOut: async (data: { itemId: number; quantity: number; unit: string; note?: string; branchId?: number }) => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 150);

    const item = await db.items.get(data.itemId);
    if (!item) throw new Error('Không tìm thấy nguyên liệu');

    const branchId = data.branchId || item.branchId || 1;
    const branchName =
      branchId === 2
        ? 'Sen Việt Buffet - Chi nhánh Quế Võ'
        : 'Sen Việt Buffet - Chi nhánh Thái Nguyên';
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    // TASK-LOGIC-01: Đối chiếu tồn kho khả dụng trước khi trừ
    const lots = await db.inventoryLots.where('itemId').equals(data.itemId).toArray();
    const branchLots = lots.filter((l) => !branchId || !l.branchId || l.branchId === branchId);
    const targetLots = branchLots.length > 0 ? branchLots : lots;
    const totalAvailableStock = Number(
      targetLots.reduce((sum, l) => sum + (Number(l.currentStock) || 0), 0).toFixed(2)
    );

    if (data.quantity > totalAvailableStock) {
      throw new Error(
        `Số lượng yêu cầu (${data.quantity} ${data.unit}) vượt quá tồn kho khả dụng (${totalAvailableStock} ${data.unit})`
      );
    }

    const newLog: TakeOutLog = {
      id: Date.now(),
      branchId,
      item,
      quantity: data.quantity,
      unit: data.unit,
      note: data.note,
      createdAt: now,
    };

    await db.takeOutLogs.add(newLog);

    // 1. Trừ chính xác currentStock trong các lot (lần lượt đến khi hết số lượng xuất)
    let remainingToDeduct = data.quantity;
    for (const lot of targetLots) {
      if (remainingToDeduct <= 0) break;
      const stock = Number(lot.currentStock) || 0;
      if (stock > 0) {
        const deduct = Math.min(stock, remainingToDeduct);
        const newStock = Number((stock - deduct).toFixed(2));
        await db.inventoryLots.update(lot.id, { currentStock: newStock });
        remainingToDeduct = Number((remainingToDeduct - deduct).toFixed(2));
      }
    }

    // 2. Tạo biến động thẻ kho XUẤT_CHẾ_BIẾN vào warehouseDocuments
    const docCode = `PXK-CB-${Date.now().toString().slice(-6)}`;
    const cost = item.costPrice || 100000;
    const totalAmount = Math.round(data.quantity * cost);

    const doc: any = {
      id: Date.now(),
      docCode,
      docType: 'XUAT_CHE_BIEN',
      branchId,
      branchName,
      createdBy: 'bep_tn',
      createdByName: 'Bếp viên lấy hàng chế biến',
      status: 'DA_DUYET',
      location: 'KHO_BEP',
      warehouseLocation: 'KHO_BEP',
      note: data.note || `Xuất chế biến cho bếp (${item.itemName})`,
      totalAmount,
      totalReportedAmount: totalAmount,
      totalShortageAmount: 0,
      finalPayableAmount: totalAmount,
      createdAt: now,
      items: [
        {
          id: Date.now(),
          itemId: item.id,
          itemCode: item.itemCode,
          itemName: item.itemName,
          quantity: data.quantity,
          actualWeight: data.quantity,
          unitPrice: cost,
          unit: data.unit || item.unit || 'kg',
          reason: 'XUẤT_CHẾ_BIẾN',
          location: 'KHO_BEP',
          warehouseLocation: 'KHO_BEP',
        },
      ],
    };
    await db.warehouseDocuments.add(doc);

    return {
      success: true,
      message: `Đã xuất kho ${data.quantity} ${data.unit} [${item.itemName}] (Biến động XUẤT_CHẾ_BIẾN) thành công`,
      data: newLog,
    };
  },

  // Lấy lịch sử lấy hàng
  getTakeOutLogs: async (): Promise<TakeOutLog[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(60, 100);
    const logs = await db.takeOutLogs.toArray();
    return logs.reverse();
  },

  // Hủy thao tác lấy hàng (hoàn trả lại kho)
  cancelTakeOut: async (id: number) => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);
    const log = await db.takeOutLogs.get(id);
    if (!log) throw new Error('Không tìm thấy bản ghi lấy hàng');
    if (log.isCancelled) throw new Error('Bản ghi lấy hàng này đã được hoàn trả trước đó');

    const itemId = log.item?.id || log.itemId;
    if (itemId) {
      const lot = await db.inventoryLots.where('itemId').equals(itemId).first();
      if (lot && lot.currentStock !== undefined) {
        await db.inventoryLots.update(lot.id, { currentStock: lot.currentStock + log.quantity });
      }
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const updated = {
      ...log,
      isCancelled: true,
      status: 'CANCELLED' as const,
      cancelledAt: now,
    };
    await db.takeOutLogs.put(updated);

    return {
      success: true,
      message: `Đã hủy thao tác lấy hàng và hoàn trả ${log.quantity} ${log.unit} vào kho`,
      data: updated,
    };
  },

  // Nút 2A: Khởi tạo mẻ chế biến
  startBatch: async (data: {
    itemId: number;
    inputWeight: number;
    unit: string;
    note?: string;
    forceSecondBatch?: boolean;
  }) => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 160);

    const item = await db.items.get(data.itemId);
    if (!item) throw new Error('Không tìm thấy món ăn');

    // Kiểm tra xem món này có mẻ đang làm dở dang không
    const activeBatches = await db.batches
      .filter((b) => b.itemId === data.itemId && b.status === 'DANG_LAM')
      .toArray();

    if (activeBatches.length > 0 && !data.forceSecondBatch) {
      const err: any = new Error(
        `Món [${item.itemName}] đang có mẻ chưa hoàn tất cân thành phẩm. Bạn có chắc muốn mở thêm mẻ mới?`
      );
      err.response = {
        status: 409,
        data: {
          success: false,
          message: err.message,
          activeBatchCode: activeBatches[0].batchCode,
        },
      };
      throw err;
    }

    const recipe = await db.recipes.where('itemId').equals(data.itemId).first();
    const standardLossRate = recipe ? recipe.standardLossRate : 5.0;
    const now = new Date();
    const codeSuffix = Math.floor(Math.random() * 900) + 100;
    const batchCode = `BATCH-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${codeSuffix}`;

    const newBatch: BatchResponse = {
      id: Date.now(),
      batchCode,
      itemId: item.id,
      itemName: item.itemName,
      itemCode: item.itemCode,
      inputWeight: data.inputWeight,
      outputWeight: null,
      lossRate: null,
      standardLossRate,
      overStandard: false,
      secondBatch: activeBatches.length > 0,
      status: 'DANG_LAM',
      startedBy: 'bep_tn',
      finishedBy: null,
      startedAt: now.toISOString().replace('T', ' ').slice(0, 19),
      finishedAt: null,
      warningMessage: null,
    };

    await db.batches.add(newBatch);

    return {
      success: true,
      message: `Đã khởi tạo mẻ [${batchCode}]`,
      data: newBatch,
    };
  },

  // Nút 2B: Hoàn thành cân mẻ thành phẩm (Chống gian lận - kèm ảnh cân)
  finishBatch: async (data: {
    batchId: number;
    outputWeight: number;
    scalePhotoUrl?: string;
    requireScalePhoto?: boolean;
  }) => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 160);

    const batch = await db.batches.get(data.batchId);
    if (!batch) throw new Error('Không tìm thấy mẻ chế biến');

    // TASK-WH-04: Bắt buộc ảnh chụp bàn cân: chặn hoàn tất mẻ khi thiếu scalePhotoUrl
    if (data.requireScalePhoto && (!data.scalePhotoUrl || !data.scalePhotoUrl.trim())) {
      throw new Error('⚠️ BẮT BUỘC chụp ảnh mặt bàn cân điện tử hiển thị rõ số kg thành phẩm để chống gian lận!');
    }

    if (data.outputWeight > batch.inputWeight) {
      throw new Error('Khối lượng thành phẩm không thể vượt quá khối lượng nguyên liệu đầu vào');
    }

    const lossRate = Number(
      (((batch.inputWeight - data.outputWeight) / batch.inputWeight) * 100).toFixed(1)
    );
    const overStandard = lossRate > batch.standardLossRate;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const warningMessage = overStandard
      ? `⚠️ Hao hụt thực tế ${lossRate}% vượt quá định mức chuẩn ${batch.standardLossRate}% (+${(
          lossRate - batch.standardLossRate
        ).toFixed(1)}%)`
      : null;

    const updated: BatchResponse = {
      ...batch,
      outputWeight: data.outputWeight,
      lossRate,
      overStandard,
      scalePhotoUrl: data.scalePhotoUrl || batch.scalePhotoUrl || undefined,
      approvalStatus: batch.approvalStatus || 'CHO_DUYET',
      status: 'HOAN_THANH',
      finishedBy: 'bep_tn',
      finishedAt: now,
      warningMessage,
    };

    await db.batches.put(updated);

    // TASK-WH-06: Tự động tăng tồn kho bán thành phẩm/sơ chế tại chi nhánh (ghi chú Nhập từ mẻ [mã mẻ])
    const branchId = batch.branchId || 1;
    const branchName =
      branchId === 2
        ? 'Sen Việt Buffet - Chi nhánh Quế Võ'
        : 'Sen Việt Buffet - Chi nhánh Thái Nguyên';
    const lotBtpCode = `LOT-BTP-${batch.batchCode.replace(/^BATCH-/, '')}`;
    const item = await db.items.get(batch.itemId);
    const unitPrice = item?.costPrice || 150000;

    // 1. Tăng hoặc tạo lô tồn kho bán thành phẩm
    const existingBtpLot = await db.inventoryLots
      .filter((l: any) => l.branchId === branchId && l.batchCode === lotBtpCode)
      .first();

    if (existingBtpLot) {
      const updatedStock = Number(
        ((existingBtpLot.currentStock || 0) + data.outputWeight).toFixed(2)
      );
      await db.inventoryLots.update(existingBtpLot.id, { currentStock: updatedStock });
    } else {
      const newBtpLot = {
        id: Date.now() + 1,
        batchCode: lotBtpCode,
        itemId: batch.itemId,
        itemCode: batch.itemCode,
        itemName: `${batch.itemName} (BTP sơ chế)`,
        branchId,
        branchName,
        importDate: now.slice(0, 10),
        expiryDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        initialQuantity: data.outputWeight,
        currentStock: data.outputWeight,
        unitPrice,
        unit: 'kg',
        status: 'ACTIVE',
        location: 'KHO_BEP',
        warehouseLocation: 'KHO_BEP',
        note: `Nhập từ mẻ [${batch.batchCode}]`,
      };
      await db.inventoryLots.add(newBtpLot);
    }

    // 2. Tạo chứng từ nhập bán thành phẩm vào warehouseDocuments
    const pnkCode = `PNK-BTP-${Date.now().toString().slice(-6)}`;
    const totalBtpAmount = Math.round(data.outputWeight * unitPrice);
    const btpDoc: any = {
      id: Date.now() + 2,
      docCode: pnkCode,
      docType: 'NHAP_BTP',
      branchId,
      branchName,
      createdBy: 'bep_tn',
      createdByName: 'Bếp hoàn tất cân mẻ',
      status: 'DA_DUYET',
      location: 'KHO_BEP',
      warehouseLocation: 'KHO_BEP',
      note: `Nhập từ mẻ [${batch.batchCode}]`,
      totalAmount: totalBtpAmount,
      totalReportedAmount: totalBtpAmount,
      totalShortageAmount: 0,
      finalPayableAmount: totalBtpAmount,
      createdAt: now,
      items: [
        {
          id: Date.now() + 3,
          itemId: batch.itemId,
          itemCode: batch.itemCode,
          itemName: `${batch.itemName} (BTP sơ chế)`,
          batchCode: lotBtpCode,
          quantity: data.outputWeight,
          actualWeight: data.outputWeight,
          unitPrice,
          unit: 'kg',
          reason: `Nhập từ mẻ [${batch.batchCode}]`,
          location: 'KHO_BEP',
          warehouseLocation: 'KHO_BEP',
        },
      ],
    };
    await db.warehouseDocuments.add(btpDoc);

    return {
      success: true,
      message: `Đã hoàn tất cân mẻ. Hao hụt thực tế: ${lossRate}%. Tự động nhập kho bán thành phẩm: +${data.outputWeight} kg`,
      data: updated,
    };
  },

  // TASK-WH-05: Bếp Trưởng / Quản Lý Xác nhận mẻ hợp lệ
  approveBatch: async (data: { batchId: number; approvedBy: string; note?: string }) => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);
    const batch = await db.batches.get(data.batchId);
    if (!batch) throw new Error('Không tìm thấy mẻ chế biến');
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const updated: BatchResponse = {
      ...batch,
      approvalStatus: 'HOP_LE',
      approvedBy: data.approvedBy,
      approvedAt: now,
      approvalNote: data.note || 'Xác nhận mẻ hợp lệ, số cân đạt chuẩn',
    };
    await db.batches.put(updated);
    return {
      success: true,
      message: `Đã xác nhận mẻ [${batch.batchCode}] hợp lệ thành công`,
      data: updated,
    };
  },

  // TASK-WH-05: Bếp Trưởng / Quản Lý Lập biên bản giải trình hao hụt
  recordBatchExplanation: async (data: { batchId: number; approvedBy: string; note: string }) => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);
    const batch = await db.batches.get(data.batchId);
    if (!batch) throw new Error('Không tìm thấy mẻ chế biến');
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const updated: BatchResponse = {
      ...batch,
      approvalStatus: 'BIEN_BAN',
      approvedBy: data.approvedBy,
      approvedAt: now,
      approvalNote: data.note,
    };
    await db.batches.put(updated);
    return {
      success: true,
      message: `Đã lập biên bản giải trình hao hụt cho mẻ [${batch.batchCode}]`,
      data: updated,
    };
  },

  // Lấy danh sách các mẻ đang làm dở dang
  getActiveBatches: async (): Promise<BatchResponse[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);
    return await db.batches.filter((b) => b.status === 'DANG_LAM').toArray();
  },

  // Lấy lịch sử tất cả các mẻ
  getAllBatches: async (): Promise<BatchResponse[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);
    const batches = await db.batches.toArray();
    return batches.reverse();
  },

  // Nút 3: Ra line (+1) (TASK-WH-07: Trừ kho bán thành phẩm/sẵn sàng phục vụ của chi nhánh theo thời gian thực)
  recordLineItem: async (data: {
    itemId: number;
    quantity?: number;
    requestId?: string;
    branchId?: number;
  }) => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);

    const qty = data.quantity || 1;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const branchId = data.branchId || 1;
    const branchName =
      branchId === 2
        ? 'Sen Việt Buffet - Chi nhánh Quế Võ'
        : 'Sen Việt Buffet - Chi nhánh Thái Nguyên';

    const item = await db.items.get(data.itemId);

    const log = {
      id: Date.now(),
      branchId,
      itemId: data.itemId,
      quantity: qty,
      requestId: data.requestId,
      createdAt: now,
    };

    await db.lineLogs.add(log);

    // Trừ kho bán thành phẩm/sẵn sàng phục vụ của chi nhánh theo thời gian thực
    let remainingToDeduct = qty;
    const lots = await db.inventoryLots.where('itemId').equals(data.itemId).toArray();
    const branchLots = lots.filter((l) => !branchId || !l.branchId || l.branchId === branchId);
    const targetLots = branchLots.length > 0 ? branchLots : lots;

    // Ưu tiên trừ các lô BTP / Kho Bếp trước, sau đó các lô khác
    targetLots.sort((a, b) => {
      const aIsBtp =
        (a.batchCode && a.batchCode.includes('BTP')) ||
        a.location === 'KHO_BEP' ||
        a.warehouseLocation === 'KHO_BEP';
      const bIsBtp =
        (b.batchCode && b.batchCode.includes('BTP')) ||
        b.location === 'KHO_BEP' ||
        b.warehouseLocation === 'KHO_BEP';
      if (aIsBtp && !bIsBtp) return -1;
      if (!aIsBtp && bIsBtp) return 1;
      return (b.currentStock || 0) - (a.currentStock || 0);
    });

    for (const lot of targetLots) {
      if (remainingToDeduct <= 0) break;
      if (lot.currentStock && lot.currentStock > 0) {
        const deduct = Math.min(lot.currentStock, remainingToDeduct);
        const newStock = Number((lot.currentStock - deduct).toFixed(2));
        await db.inventoryLots.update(lot.id, { currentStock: newStock });
        remainingToDeduct -= deduct;
      }
    }
    if (remainingToDeduct > 0 && targetLots.length > 0) {
      const firstLot = targetLots[0];
      const newStock = Math.max(
        0,
        Number(((firstLot.currentStock || 0) - remainingToDeduct).toFixed(2))
      );
      await db.inventoryLots.update(firstLot.id, { currentStock: newStock });
    }

    // Tạo biến động chứng từ xuất ra line
    const pxkLineCode = `PXK-LINE-${Date.now().toString().slice(-6)}`;
    const cost = item?.costPrice || 50000;
    const totalAmount = Math.round(qty * cost);

    const lineDoc: any = {
      id: Date.now() + 1,
      docCode: pxkLineCode,
      docType: 'RA_LINE',
      branchId,
      branchName,
      createdBy: 'bep_tn',
      createdByName: 'Bếp Ra Line',
      status: 'DA_DUYET',
      location: 'KHO_BEP',
      warehouseLocation: 'KHO_BEP',
      note: `Xuất quầy line phục vụ buffet (+${qty} ${item?.unit || 'đĩa/kg'})`,
      totalAmount,
      totalReportedAmount: totalAmount,
      totalShortageAmount: 0,
      finalPayableAmount: totalAmount,
      createdAt: now,
      items: [
        {
          id: Date.now() + 2,
          itemId: data.itemId,
          itemCode: item?.itemCode || 'M-01',
          itemName: item?.itemName || 'Món quầy line',
          quantity: qty,
          actualWeight: qty,
          unitPrice: cost,
          unit: item?.unit || 'phần',
          reason: 'Xuất quầy line buffet',
          location: 'KHO_BEP',
          warehouseLocation: 'KHO_BEP',
        },
      ],
    };
    await db.warehouseDocuments.add(lineDoc);

    return {
      success: true,
      message: `Đã ra line +${qty} và trừ tồn kho bán thành phẩm phục vụ`,
      data: log,
    };
  },

  // Nút 4: Báo hỏng nguyên liệu
  recordDamageReport: async (data: {
    itemId: number;
    quantity: number;
    reason: string;
    supplierCode?: string;
    batchNumber?: string;
    note?: string;
    imageUrls?: string;
  }) => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 160);

    const item = await db.items.get(data.itemId);
    if (!item) throw new Error('Không tìm thấy nguyên liệu báo hỏng');

    const estimatedValue = Math.round(data.quantity * (item.costPrice || 50000));
    // Tự động duyệt nếu giá trị <= 300.000 đ, ngược lại chờ Quản lý duyệt
    const status = estimatedValue <= 300000 ? 'TU_DONG_DUYET' : 'CHO_DUYET';
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const report: DamageReport = {
      id: Date.now(),
      item,
      supplierCode: data.supplierCode || 'NCC-HS01',
      batchNumber: data.batchNumber || 'LOT-202611-001',
      quantity: data.quantity,
      estimatedValue,
      reason: data.reason,
      imageUrls: data.imageUrls,
      status,
      note: data.note || (status === 'TU_DONG_DUYET' ? 'Tự động duyệt (< 300k đ)' : 'Chờ Quản lý duyệt'),
      createdAt: now,
    };

    await db.damageReports.add(report);

    return {
      success: true,
      message:
        status === 'TU_DONG_DUYET'
          ? `Đã báo hỏng thành công (Tự động duyệt - Thiệt hại: ${estimatedValue.toLocaleString('vi-VN')} đ)`
          : `Đã gửi báo hỏng (Chờ Quản lý Bếp duyệt - Thiệt hại: ${estimatedValue.toLocaleString('vi-VN')} đ)`,
      data: report,
    };
  },

  // Lấy danh sách báo hỏng
  getDamageReports: async (): Promise<DamageReport[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);
    const reports = await db.damageReports.toArray();
    return reports.reverse();
  },

  // Giai đoạn 8: Lấy danh sách món tươi dùng trong ngày còn tồn cuối ca
  getDailyOnlyRemaining: async (): Promise<DailyRemainingItem[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);
    return await db.dailyRemaining.toArray();
  },

  // Giai đoạn 8: Xác nhận ghi bỏ món dùng trong ngày cuối ca
  confirmDailyWaste: async (data: ConfirmDailyWasteRequest) => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 160);
    await db.dailyRemaining.clear();
    return {
      success: true,
      message: `Đã xác nhận ghi bỏ ${data.items.length} món dùng trong ngày cho ca ${data.shift}`,
    };
  },

  // Giai đoạn 8: Thêm nhanh món mới trên màn hình ra line
  quickAddLineItem: async (data: QuickAddLineItemRequest): Promise<Item> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 150);

    const newItem: Item = {
      id: Date.now(),
      itemCode: `M-${Date.now().toString().slice(-4)}`,
      barcode: `893${Date.now().toString().slice(-9)}`,
      itemName: data.itemName,
      category: data.category,
      unit: data.unit,
      costPrice: data.costPrice || 50000,
      isBuffetLine: true,
      isDailyOnly: data.isDailyOnly || false,
    };

    await db.items.add(newItem);
    return newItem;
  },
};
