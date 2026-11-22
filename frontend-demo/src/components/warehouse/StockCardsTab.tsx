import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Calendar,
  FileSpreadsheet,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Plus,
  Eye,
  ShieldAlert,
  ChevronRight,
  Package,
  Layers,
  ThermometerSnowflake,
  X,
  Printer,
  ChevronDown,
  Building2,
} from 'lucide-react';
import {
  InventoryStock,
  ImportBatch,
  WarehouseDocument,
  WAREHOUSE_LOCATIONS,
  getItemWarehouseLocation,
  PhysicalWarehouseLocation,
  warehouseApi,
} from '../../api/warehouse';
import { Item } from '../../api/kitchen';

// TASK-WH-02: 5 Nhóm thực phẩm buffet chuẩn hoá
export type BuffetFoodGroup =
  | 'ALL'
  | 'BAN_THANH_PHAM_DONG_LANH'
  | 'HAI_SAN_THIT_TUOI_SONG'
  | 'RAU_CU_QUA_TUOI'
  | 'DO_UONG_BAR'
  | 'HANG_KHO_GIA_VI';

export const BUFFET_FOOD_GROUPS: {
  id: BuffetFoodGroup;
  name: string;
  icon: string;
  colorClass: string;
}[] = [
  { id: 'ALL', name: 'Tất cả 5 nhóm thực phẩm buffet', icon: '🍽️', colorClass: 'bg-slate-100 text-slate-800' },
  { id: 'BAN_THANH_PHAM_DONG_LANH', name: 'Bán thành phẩm đông lạnh', icon: '❄️', colorClass: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { id: 'HAI_SAN_THIT_TUOI_SONG', name: 'Hải sản & Thịt tươi sống', icon: '🦀', colorClass: 'bg-rose-100 text-rose-800 border-rose-300' },
  { id: 'RAU_CU_QUA_TUOI', name: 'Rau củ quả tươi', icon: '🥗', colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'DO_UONG_BAR', name: 'Đồ uống & Bar', icon: '🍹', colorClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'HANG_KHO_GIA_VI', name: 'Hàng khô gia vị', icon: '🧂', colorClass: 'bg-purple-100 text-purple-800 border-purple-300' },
];

export function getBuffetFoodGroup(item: {
  itemCode?: string;
  itemName?: string;
  category?: string;
  warehouseLocation?: string;
}): BuffetFoodGroup {
  const code = (item.itemCode || '').toUpperCase();
  const name = (item.itemName || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  const loc = item.warehouseLocation || '';

  // 1. Đồ uống & Bar
  if (
    cat.includes('bar') ||
    cat.includes('đồ uống') ||
    cat.includes('tráng miệng') ||
    code.includes('BAR') ||
    code.includes('BIA') ||
    code.includes('RUOU') ||
    code.includes('NUOC') ||
    name.includes('nước ngọt') ||
    name.includes('bia') ||
    name.includes('rượu') ||
    name.includes('chè') ||
    loc === 'KHO_BAR'
  ) {
    return 'DO_UONG_BAR';
  }

  // 2. Rau củ quả tươi
  if (
    cat.includes('rau') ||
    cat.includes('nấm') ||
    name.includes('rau') ||
    name.includes('nấm') ||
    name.includes('củ') ||
    name.includes('quả') ||
    name.includes('ngô') ||
    name.includes('khoai') ||
    name.includes('salad')
  ) {
    return 'RAU_CU_QUA_TUOI';
  }

  // 3. Hàng khô gia vị
  if (
    cat.includes('gia vị') ||
    cat.includes('hàng khô') ||
    cat.includes('khô') ||
    name.includes('mắm') ||
    name.includes('muối') ||
    name.includes('đường') ||
    name.includes('hạt nêm') ||
    name.includes('dầu') ||
    name.includes('tiêu') ||
    name.includes('sốt') ||
    name.includes('gạo') ||
    name.includes('cồn') ||
    loc === 'KHO_KHO'
  ) {
    return 'HANG_KHO_GIA_VI';
  }

  // 4. Bán thành phẩm đông lạnh
  if (
    code.startsWith('BTP-') ||
    code.startsWith('LOT-BEP') ||
    cat.includes('bán thành phẩm') ||
    cat.includes('sơ chế') ||
    cat.includes('đông lạnh') ||
    name.includes('bán thành phẩm') ||
    name.includes('sơ chế') ||
    name.includes('btp') ||
    (loc === 'KHO_DONG_LANH' &&
      (name.includes('đông lạnh') ||
        name.includes('phi lê') ||
        name.includes('cuộn') ||
        code.includes('MUCTRUN')))
  ) {
    return 'BAN_THANH_PHAM_DONG_LANH';
  }

  // 5. Hải sản & Thịt tươi sống
  if (
    cat.includes('hải sản') ||
    cat.includes('thịt') ||
    cat.includes('sống') ||
    cat.includes('vỏ cứng') ||
    code.includes('CUA') ||
    code.includes('GHE') ||
    code.includes('TOM') ||
    code.includes('BO') ||
    code.includes('SUON') ||
    code.includes('BEBE') ||
    loc === 'KHO_BE_SONG' ||
    loc === 'KHO_DONG_LANH'
  ) {
    return 'HAI_SAN_THIT_TUOI_SONG';
  }

  return 'HANG_KHO_GIA_VI';
}

export interface StockCardTransaction {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  docCode: string;
  type: 'NHAP' | 'XUAT_BEP' | 'XUAT_CHE_BIEN' | 'RA_LINE' | 'XUAT_HUY' | 'KIEM_KE' | string;
  typeName: string;
  inQty: number;
  outQty: number;
  balanceQty: number;
  unit: string;
  performer: string;
  note: string;
  batchCode?: string;
  refSupplier?: string;
}

interface StockCardsTabProps {
  stocks: InventoryStock[];
  batches: ImportBatch[];
  buffetItems: Item[];
  documents: WarehouseDocument[];
  onOpenDocModal: (type: 'NHAP' | 'XUAT_CHUYEN' | 'HUY') => void;
  hideFinancials?: boolean;
}

export const StockCardsTab: React.FC<StockCardsTabProps> = ({
  stocks,
  batches,
  buffetItems,
  documents,
  onOpenDocModal,
  hideFinancials = false,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'SAFE'>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  // Stock Card Modal State
  const [selectedStockItem, setSelectedStockItem] = useState<{
    itemId: number;
    itemCode: string;
    itemName: string;
    unit: string;
    category: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    unitPrice: number;
    storage?: string;
    branchId?: number;
    branchCode?: 'TN' | 'QV';
    branchName?: string;
    buffetGroup?: BuffetFoodGroup;
  } | null>(null);

  const [cardDateFrom, setCardDateFrom] = useState<string>('2026-11-01');
  const [cardDateTo, setCardDateTo] = useState<string>('2026-11-30');
  const [cardTypeFilter, setCardTypeFilter] = useState<string>('ALL');

  // Chuẩn hóa định mức Min/Max Stock cho từng mặt hàng (tham chiếu nội bộ)
  const getMinMaxStock = (itemCode: string, category?: string) => {
    const code = (itemCode || '').toUpperCase();
    const cat = (category || '').toLowerCase();

    if (code.includes('CUA') || code.includes('GHE') || code.includes('TOM') || code.includes('CAHOI')) {
      return { minStock: 20, maxStock: 80, storage: 'Bể sủi oxy & Kho lạnh -2°C ~ 2°C' };
    }
    if (code.includes('MUC') || code.includes('BACHTUOC') || code.includes('HAU')) {
      return { minStock: 25, maxStock: 100, storage: 'Kho cấp đông -18°C' };
    }
    if (code.includes('BO') || code.includes('THIT') || cat.includes('thịt')) {
      return { minStock: 30, maxStock: 120, storage: 'Kho cấp đông -18°C' };
    }
    if (cat.includes('rau') || cat.includes('nấm')) {
      return { minStock: 15, maxStock: 50, storage: 'Kho mát rau củ 4°C ~ 8°C' };
    }
    return { minStock: 15, maxStock: 60, storage: 'Kho khô nhiệt độ phòng 25°C' };
  };

  // TASK-WH-02 & TASK-LOGIC-03: Tính toán tồn khả dụng đa chi nhánh & 5 nhóm thực phẩm buffet (Dữ liệu thực tế 100%)
  const consolidatedStocks = useMemo(() => {
    // Build map from items and batches keyed by `${branchId}-${itemId}`
    const map = new Map<string, {
      itemId: number;
      itemCode: string;
      itemName: string;
      unit: string;
      category: string;
      currentStock: number;
      activeBatchesCount: number;
      minStock: number;
      maxStock: number;
      unitPrice: number;
      storage: string;
      branchId: number;
      branchCode: 'TN' | 'QV';
      branchName: string;
      buffetGroup: BuffetFoodGroup;
      warehouseLocation: PhysicalWarehouseLocation;
      lastImportDate?: string;
    }>();

    // 1. Seed from buffet items cho cả chi nhánh Thái Nguyên (1) và Quế Võ (2)
    for (const bi of buffetItems) {
      const { minStock, maxStock, storage } = getMinMaxStock(bi.itemCode, bi.category);
      const loc = getItemWarehouseLocation(bi.itemCode, bi.category);
      const bGroup = getBuffetFoodGroup({ ...bi, warehouseLocation: loc });

      // Chi nhánh Thái Nguyên (TN - 1)
      map.set(`1-${bi.id}`, {
        itemId: bi.id,
        itemCode: bi.itemCode,
        itemName: bi.itemName,
        unit: bi.unit || 'kg',
        category: bi.category || 'Món chính',
        currentStock: 0,
        activeBatchesCount: 0,
        minStock,
        maxStock,
        unitPrice: bi.costPrice || 180000,
        storage,
        branchId: 1,
        branchCode: 'TN',
        branchName: 'Sen Việt Thái Nguyên',
        buffetGroup: bGroup,
        warehouseLocation: loc,
      });

      // Chi nhánh Quế Võ (QV - 2)
      map.set(`2-${bi.id}`, {
        itemId: bi.id,
        itemCode: bi.itemCode,
        itemName: bi.itemName,
        unit: bi.unit || 'kg',
        category: bi.category || 'Món chính',
        currentStock: 0,
        activeBatchesCount: 0,
        minStock,
        maxStock,
        unitPrice: bi.costPrice || 180000,
        storage,
        branchId: 2,
        branchCode: 'QV',
        branchName: 'Sen Việt Quế Võ',
        buffetGroup: bGroup,
        warehouseLocation: loc,
      });
    }

    // 2. Aggregate batch stocks theo đúng chi nhánh từ batches / stocks thực tế
    for (const b of batches) {
      const bId = b.branchId || 1;
      const bCode: 'TN' | 'QV' = bId === 2 ? 'QV' : 'TN';
      const key = `${bId}-${b.itemId}`;
      const stockQty = Number(b.currentStock) || 0;
      const existing = map.get(key);

      if (existing) {
        existing.currentStock = Number((existing.currentStock + stockQty).toFixed(2));
        if (stockQty > 0) existing.activeBatchesCount += 1;
        if (!existing.lastImportDate || b.importDate > existing.lastImportDate) {
          existing.lastImportDate = b.importDate;
        }
        if (b.unitPrice > 0) existing.unitPrice = b.unitPrice;
        if (b.warehouseLocation) {
          existing.warehouseLocation = b.warehouseLocation as PhysicalWarehouseLocation;
        }
      } else {
        const { minStock, maxStock, storage } = getMinMaxStock(b.itemCode || '', '');
        const loc =
          (b.warehouseLocation as PhysicalWarehouseLocation) ||
          getItemWarehouseLocation(b.itemCode, '');
        const bGroup = getBuffetFoodGroup({
          itemCode: b.itemCode,
          itemName: b.itemName,
          warehouseLocation: loc,
        });

        map.set(key, {
          itemId: b.itemId,
          itemCode: b.itemCode || `M-${b.itemId}`,
          itemName: b.itemName || 'Mặt hàng',
          unit: b.unit || 'kg',
          category: 'Nguyên liệu',
          currentStock: stockQty,
          activeBatchesCount: stockQty > 0 ? 1 : 0,
          minStock,
          maxStock,
          unitPrice: b.unitPrice || 200000,
          storage,
          branchId: bId,
          branchCode: bCode,
          branchName: bId === 2 ? 'Sen Việt Quế Võ' : 'Sen Việt Thái Nguyên',
          buffetGroup: bGroup,
          warehouseLocation: loc,
          lastImportDate: b.importDate,
        });
      }
    }

    // Trả về số lượng tồn kho thực tế (KHÔNG gán đè mock baseline)
    return Array.from(map.values());
  }, [buffetItems, batches]);

  // Bộ lọc danh sách tồn (TN / QV / Toàn Chuỗi + 5 Nhóm Buffet + Cảnh Báo - TASK-LOGIC-04: Xóa warehouseFilter)
  const filteredStocks = useMemo(() => {
    return consolidatedStocks.filter((s) => {
      // Search
      const matchSearch =
        !searchTerm ||
        s.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.itemCode.toLowerCase().includes(searchTerm.toLowerCase());

      // TASK-WH-02: Bộ lọc 5 Nhóm Thực Phẩm Buffet
      const matchCat =
        categoryFilter === 'ALL' ||
        s.buffetGroup === categoryFilter ||
        s.category.toLowerCase().includes(categoryFilter.toLowerCase());

      // TASK-WH-02: Bộ lọc Chi Nhánh (TN / QV / Toàn Chuỗi)
      const matchBranch =
        branchFilter === 'ALL' ||
        ((branchFilter === 'TN' || branchFilter === '1') && s.branchId === 1) ||
        ((branchFilter === 'QV' || branchFilter === '2') && s.branchId === 2);

      // TASK-LOGIC-03: Alert Filter: HẾT HÀNG (<= 0), SẮP HẾT (<= 5), TỒN AN TOÀN (> 5)
      let matchAlert = true;
      if (alertFilter === 'CRITICAL') {
        matchAlert = s.currentStock <= 0;
      } else if (alertFilter === 'WARNING') {
        matchAlert = s.currentStock > 0 && s.currentStock <= 5;
      } else if (alertFilter === 'SAFE') {
        matchAlert = s.currentStock > 5;
      }

      return matchSearch && matchCat && matchBranch && matchAlert;
    });
  }, [consolidatedStocks, searchTerm, categoryFilter, branchFilter, alertFilter]);

  // Thống kê nhanh KPI Tồn kho theo bộ lọc hiện tại (TASK-LOGIC-03: Tối giản 3 KPI thực chiến)
  const totalStockValue = useMemo(() => {
    return filteredStocks.reduce((sum, s) => sum + s.currentStock * s.unitPrice, 0);
  }, [filteredStocks]);

  const outOfStockCount = useMemo(() => {
    return consolidatedStocks.filter((s) => s.currentStock <= 0).length;
  }, [consolidatedStocks]);

  const lowStockCount = useMemo(() => {
    return consolidatedStocks.filter((s) => s.currentStock > 0 && s.currentStock <= 5).length;
  }, [consolidatedStocks]);

  // TASK-LOGIC-02: Nối động 100% lịch sử giao dịch từ IndexedDB (warehouseDocuments, takeOutLogs, inventoryLots, inventoryChecks)
  const [dbLedgerEntries, setDbLedgerEntries] = useState<StockCardTransaction[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedStockItem) {
      setDbLedgerEntries([]);
      return;
    }

    let isMounted = true;
    setIsLoadingLedger(true);

    warehouseApi
      .getStockLedger(selectedStockItem.itemId, selectedStockItem.branchId)
      .then((entries) => {
        if (!isMounted) return;
        const txs: StockCardTransaction[] = entries.map((entry) => {
          const dt = entry.date || '';
          const datePart = dt.slice(0, 10);
          const timePart = dt.slice(11, 16) || '10:00';
          return {
            id: String(entry.id),
            timestamp: dt,
            date: datePart,
            time: timePart,
            docCode: entry.docCode,
            type: entry.docType,
            typeName: entry.docTypeName,
            inQty: entry.inQty,
            outQty: entry.outQty,
            balanceQty: entry.balance,
            unit: entry.unit || selectedStockItem.unit,
            performer: entry.performer || 'NV: bep_tn',
            note: entry.note || entry.partnerOrReason || '',
            batchCode: entry.batchCode,
            refSupplier: entry.partnerOrReason?.includes('NCC') ? entry.partnerOrReason : undefined,
          };
        });
        setDbLedgerEntries(txs);
      })
      .catch((err) => {
        console.error('Lỗi khi nạp thẻ kho động từ IndexedDB:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingLedger(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedStockItem, documents]);

  // Dòng thời gian Thẻ kho (Stock Ledger Timeline) lọc theo ngày & loại biến động
  const stockLedgerTransactions = useMemo<StockCardTransaction[]>(() => {
    return dbLedgerEntries.filter((tx) => {
      const matchDate =
        (!cardDateFrom || tx.date >= cardDateFrom) && (!cardDateTo || tx.date <= cardDateTo);
      const matchType = cardTypeFilter === 'ALL' || tx.type === cardTypeFilter;
      return matchDate && matchType;
    });
  }, [dbLedgerEntries, cardDateFrom, cardDateTo, cardTypeFilter]);

  // Các chỉ số tổng hợp trong kỳ của popup thẻ kho (tính toán động 100%)
  const totalInPeriod = useMemo(
    () => stockLedgerTransactions.reduce((acc, t) => acc + t.inQty, 0),
    [stockLedgerTransactions]
  );
  const totalOutPeriod = useMemo(
    () => stockLedgerTransactions.reduce((acc, t) => acc + t.outQty, 0),
    [stockLedgerTransactions]
  );
  const currentFinalBalance = useMemo(() => {
    if (stockLedgerTransactions.length > 0) {
      return stockLedgerTransactions[0].balanceQty;
    }
    return selectedStockItem?.currentStock || 0;
  }, [stockLedgerTransactions, selectedStockItem]);

  const openingBalance = useMemo(() => {
    return Math.max(0, Number((currentFinalBalance - totalInPeriod + totalOutPeriod).toFixed(2)));
  }, [currentFinalBalance, totalInPeriod, totalOutPeriod]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 3 KPI Overview Cards (TASK-LOGIC-03 & TASK-LOGIC-05: Tối giản 3 thẻ KPI thực chiến) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Tổng Mặt Hàng Quản Lý */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wide">
              Tổng Mặt Hàng Quản Lý
            </span>
            <Boxes className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            {consolidatedStocks.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Theo dõi tồn kho thời gian thực 2 chi nhánh
          </div>
        </div>

        {/* Card 2: Mặt Hàng Hết Sạch Kho (Cần nhập ngay) */}
        <div
          className={`p-4 rounded-2xl border shadow-sm transition-all ${
            outOfStockCount > 0
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/30'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1">
              <ShieldAlert className="h-4 w-4 text-rose-600 animate-pulse" />
              <span>Mặt Hàng Hết Sạch Kho</span>
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-rose-700 mt-1 flex items-baseline gap-2">
            <span>{outOfStockCount}</span>
            <span className="text-xs font-bold text-rose-600">món cần nhập ngay!</span>
          </div>
          <div className="text-[10px] text-rose-600 mt-0.5 font-medium">
            Tồn thực tế &le; 0 • Nguy cơ đứt hàng phục vụ
          </div>
        </div>

        {/* Card 3: Tổng Giá Trị Tồn Kho (Chỉ hiện cho Kế toán & Giám đốc) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wide">
              Tổng Giá Trị Tồn Kho
            </span>
            <Package className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black font-mono text-indigo-950 mt-1">
            {hideFinancials ? '*** (Bảo mật tài chính)' : `${totalStockValue.toLocaleString('vi-VN')} đ`}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            {hideFinancials ? 'Chỉ Giám Đốc & Kế Toán được xem giá trị tiền' : '✓ Đã đồng bộ với kết quả kiểm kê gần nhất'}
          </div>
        </div>
      </div>

      {/* Toolbar & Filters (TASK-LOGIC-04: Xóa dropdown phân vùng kho vật lý trùng lặp) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Ô tìm kiếm Search-as-you-type */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên món hoặc mã hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* TASK-WH-02: Bộ Lọc 5 Nhóm Thực Phẩm Buffet */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-indigo-600" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-indigo-200 text-xs font-bold text-indigo-950 bg-indigo-50/60"
            >
              {BUFFET_FOOD_GROUPS.map((grp) => (
                <option key={grp.id} value={grp.id}>
                  {grp.icon} {grp.name}
                </option>
              ))}
            </select>
          </div>

          {/* TASK-LOGIC-03: Lọc Tình Trạng Cảnh Báo (Hết hàng <= 0, Sắp hết <= 5, Tồn an toàn) */}
          <div className="flex items-center gap-1 text-xs">
            <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={alertFilter}
              onChange={(e) => setAlertFilter(e.target.value as any)}
              className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
            >
              <option value="ALL">Tất cả tình trạng</option>
              <option value="CRITICAL">🔴 Hết hàng (&le; 0)</option>
              <option value="WARNING">🟡 Sắp hết hàng (&le; 5)</option>
              <option value="SAFE">🟢 Tồn kho an toàn (&gt; 5)</option>
            </select>
          </div>

          {/* TASK-WH-02: Bộ Lọc Chi Nhánh (TN / QV / Toàn Chuỗi) */}
          <div className="flex items-center gap-1 text-xs">
            <Building2 className="h-3.5 w-3.5 text-indigo-600" />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-indigo-200 text-xs font-bold text-slate-800 bg-white"
            >
              <option value="ALL">🏢 Toàn Chuỗi (TN & QV)</option>
              <option value="TN">📍 Chi nhánh Thái Nguyên (TN)</option>
              <option value="QV">📍 Chi nhánh Quế Võ (QV)</option>
            </select>
          </div>
        </div>

        {/* Nút thao tác nhanh */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenDocModal('NHAP')}
            className="btn-touch px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Lập Phiếu Nhập Hàng</span>
          </button>
        </div>
      </div>

      {/* Bảng Danh Sách Tồn Kho & Thẻ Kho Tức Thời (TASK-LOGIC-03: Bỏ Min/Max Stock, làm nổi bật Tồn thực tế) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-270px)] relative">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-extrabold text-[11px] uppercase tracking-wider sticky top-0 z-30 shadow-sm">
              <tr>
                <th className="p-3.5 sticky left-0 z-40 bg-slate-100 w-28">Mã Hàng</th>
                <th className="p-3.5 sticky left-28 z-40 bg-slate-100 min-w-[200px] border-r border-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Tên Mặt Hàng / Quy Cách
                </th>
                <th className="p-3.5">Chi Nhánh</th>
                <th className="p-3.5">Nhóm Thực Phẩm Buffet</th>
                <th className="p-3.5 text-center">ĐVT</th>
                <th className="p-3.5 text-right font-black text-indigo-950">Tồn Thực Tế</th>
                {!hideFinancials && (
                  <th className="p-3.5 text-right font-mono">Giá Trị Tồn (VNĐ)</th>
                )}
                <th className="p-3.5 text-center">Trạng Thái Màu</th>
                <th className="p-3.5 text-right sticky right-0 z-40 bg-slate-100 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Thẻ Kho
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={hideFinancials ? 8 : 9} className="p-10 text-center text-slate-400">
                    <Boxes className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold">Không tìm thấy mặt hàng nào phù hợp với bộ lọc</p>
                  </td>
                </tr>
              ) : (
                filteredStocks.map((item) => {
                  const isOutOfStock = item.currentStock <= 0;
                  const isLowStock = item.currentStock > 0 && item.currentStock <= 5;

                  return (
                    <tr
                      key={`${item.branchId}-${item.itemId}`}
                      className={`hover:bg-slate-50 transition-colors group ${
                        isOutOfStock ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <td
                        className={`p-3.5 font-mono font-bold text-indigo-700 sticky left-0 z-20 w-28 ${
                          isOutOfStock ? 'bg-rose-50' : 'bg-white group-hover:bg-slate-50'
                        }`}
                      >
                        {item.itemCode}
                      </td>
                      <td
                        className={`p-3.5 font-bold text-slate-900 sticky left-28 z-20 min-w-[200px] border-r border-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                          isOutOfStock ? 'bg-rose-50' : 'bg-white group-hover:bg-slate-50'
                        }`}
                      >
                        <div>{item.itemName}</div>
                        <div className="text-[10px] text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                          <ThermometerSnowflake className="h-3 w-3 text-cyan-600" />
                          <span>{item.storage}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                            item.branchCode === 'QV'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}
                        >
                          <Building2 className="h-3 w-3" />
                          <span>{item.branchCode === 'QV' ? 'Quế Võ (QV)' : 'Thái Nguyên (TN)'}</span>
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          {(() => {
                            const groupMeta = BUFFET_FOOD_GROUPS.find((g) => g.id === item.buffetGroup);
                            return (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                  groupMeta?.colorClass || 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {groupMeta?.icon || '🍽️'} {groupMeta?.name || item.category}
                              </span>
                            );
                          })()}
                          {(() => {
                            const locMeta = WAREHOUSE_LOCATIONS.find(
                              (l) => l.code === item.warehouseLocation
                            );
                            return (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                                {locMeta?.icon || '🏢'} {locMeta?.name || item.warehouseLocation}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-medium">{item.unit}</td>
                      <td className="p-3.5 text-right font-mono font-black text-base text-indigo-950">
                        <span
                          className={
                            isOutOfStock
                              ? 'text-rose-600 animate-pulse'
                              : isLowStock
                              ? 'text-amber-600'
                              : 'text-indigo-950'
                          }
                        >
                          {item.currentStock.toFixed(2)}
                        </span>{' '}
                        <span className="text-xs font-bold text-slate-500">{item.unit}</span>
                      </td>
                      {!hideFinancials && (
                        <td className="p-3.5 text-right font-mono font-black text-indigo-950">
                          {(item.currentStock * item.unitPrice).toLocaleString('vi-VN')} đ
                        </td>
                      )}
                      <td className="p-3.5 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                            <ShieldAlert className="h-3 w-3" />
                            <span>🔴 HẾT HÀNG</span>
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <AlertTriangle className="h-3 w-3" />
                            <span>🟡 SẮP HẾT</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>🟢 TỒN AN TOÀN</span>
                          </span>
                        )}
                      </td>
                      <td
                        className={`p-3.5 text-right sticky right-0 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                          isOutOfStock ? 'bg-rose-50' : 'bg-white group-hover:bg-slate-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedStockItem(item)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs inline-flex items-center gap-1 transition-all shadow-sm hover:scale-105"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Xem Thẻ Kho</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL: XEM THẺ KHO CHI TIẾT (REALTIME STOCK CARD LEDGER)             */}
      {/* =================================================================== */}
      {selectedStockItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Top Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg flex items-center gap-2">
                    <span>THẺ KHO NGUYÊN LIỆU: {selectedStockItem.itemName}</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-mono text-xs border border-indigo-400/30">
                      {selectedStockItem.itemCode}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ĐVT: <strong>{selectedStockItem.unit}</strong> • Kho bảo quản:{' '}
                    <strong>{selectedStockItem.storage}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
                  title="In thẻ kho"
                >
                  <Printer className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStockItem(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quick Summary Cards Inside Modal (TASK-LOGIC-02: Tính toán động 100%) */}
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Tồn Đầu Kỳ
                </span>
                <span className="font-mono font-black text-slate-800 text-sm sm:text-base mt-0.5 block">
                  {openingBalance.toFixed(2)} {selectedStockItem.unit}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-emerald-600 block text-[10px] uppercase font-bold">
                  Tổng Nhập Trong Kỳ (+)
                </span>
                <span className="font-mono font-black text-emerald-700 text-sm sm:text-base mt-0.5 block">
                  +{totalInPeriod.toFixed(2)} {selectedStockItem.unit}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-rose-600 block text-[10px] uppercase font-bold">
                  Tổng Xuất (Bếp + Hủy) (-)
                </span>
                <span className="font-mono font-black text-rose-700 text-sm sm:text-base mt-0.5 block">
                  -{totalOutPeriod.toFixed(2)} {selectedStockItem.unit}
                </span>
              </div>
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                <span className="text-indigo-800 block text-[10px] uppercase font-bold">
                  Tồn Kho Thực Tế Cuối Kỳ
                </span>
                <span className="font-mono font-black text-indigo-950 text-sm sm:text-base mt-0.5 block">
                  {currentFinalBalance.toFixed(2)} {selectedStockItem.unit}
                </span>
              </div>
            </div>

            {/* Date Range & Type Filter Controls */}
            <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Từ:</span>
                  <input
                    type="date"
                    value={cardDateFrom}
                    onChange={(e) => setCardDateFrom(e.target.value)}
                    className="h-8 px-2 rounded-lg border border-slate-300 font-mono text-[11px]"
                  />
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <span>Đến:</span>
                  <input
                    type="date"
                    value={cardDateTo}
                    onChange={(e) => setCardDateTo(e.target.value)}
                    className="h-8 px-2 rounded-lg border border-slate-300 font-mono text-[11px]"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <select
                    value={cardTypeFilter}
                    onChange={(e) => setCardTypeFilter(e.target.value)}
                    className="h-8 px-2 rounded-lg border border-slate-300 text-[11px] font-bold text-slate-700"
                  >
                    <option value="ALL">Tất cả loại biến động</option>
                    <option value="NHAP">📥 Nhập kho (NCC / BTP)</option>
                    <option value="XUAT_CHE_BIEN">🍳 Xuất chế biến</option>
                    <option value="RA_LINE">🍽️ Ra line buffet (+1)</option>
                    <option value="XUAT_BEP">🍳 Xuất bếp nấu</option>
                    <option value="XUAT_HUY">🗑️ Xuất hủy kho</option>
                    <option value="KIEM_KE">🔍 Kiểm kê đối soát</option>
                  </select>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                Hiển thị <strong>{stockLedgerTransactions.length}</strong> giao dịch biến động
              </div>
            </div>

            {/* Bảng Dòng Thời Gian Thẻ Kho Chuẩn Kế Toán */}
            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider">
                      <th className="p-2.5">Thời Gian</th>
                      <th className="p-2.5">Số Chứng Từ</th>
                      <th className="p-2.5">Loại Biến Động</th>
                      <th className="p-2.5 text-right text-emerald-800">Nhập (+)</th>
                      <th className="p-2.5 text-right text-rose-800">Xuất (-)</th>
                      <th className="p-2.5 text-right font-black text-indigo-950">Tồn Lũy Kế</th>
                      <th className="p-2.5">Người Thực Hiện</th>
                      <th className="p-2.5">Diễn Giải / Ghi Chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {isLoadingLedger ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          <RefreshCw className="h-5 w-5 mx-auto animate-spin mb-2 text-indigo-600" />
                          <span>Đang đồng bộ thẻ kho từ IndexedDB...</span>
                        </td>
                      </tr>
                    ) : stockLedgerTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          Chưa có giao dịch biến động nào trong khoảng thời gian đã chọn
                        </td>
                      </tr>
                    ) : (
                      stockLedgerTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-2.5 font-mono text-slate-500 whitespace-nowrap">
                            <div>{tx.date}</div>
                            <div className="text-[10px] text-slate-400">{tx.time}</div>
                          </td>
                          <td className="p-2.5 font-mono font-bold text-indigo-700 whitespace-nowrap">
                            {tx.docCode}
                            {tx.batchCode && (
                              <div className="text-[10px] text-slate-400 font-normal">
                                {tx.batchCode}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                tx.type === 'NHAP'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : tx.type === 'XUAT_BEP' || tx.type === 'XUAT_CHE_BIEN'
                                  ? 'bg-blue-100 text-blue-800'
                                  : tx.type === 'XUAT_HUY' || tx.type === 'HUY'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {tx.typeName}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                            {tx.inQty > 0 ? `+${tx.inQty.toFixed(2)}` : '--'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-rose-700">
                            {tx.outQty > 0 ? `-${tx.outQty.toFixed(2)}` : '--'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-indigo-950 text-sm">
                            {tx.balanceQty.toFixed(2)} {tx.unit}
                          </td>
                          <td className="p-2.5 font-medium text-slate-800">{tx.performer}</td>
                          <td className="p-2.5 text-slate-600 max-w-xs">
                            <div>{tx.note}</div>
                            {tx.refSupplier && (
                              <div className="text-[10px] text-indigo-600 font-semibold">
                                NCC: {tx.refSupplier}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Bottom Close Button */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
              <div className="text-[11px] text-slate-500">
                * Thẻ kho được ghi nhận tự động ngay khi phiếu Nhập / Xuất / Hủy được duyệt.
              </div>
              <button
                type="button"
                onClick={() => setSelectedStockItem(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
              >
                Đóng Thẻ Kho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
