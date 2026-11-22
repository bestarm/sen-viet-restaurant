import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Download,
  Search,
  Building2,
  Users,
  Layers,
  RotateCw,
  Plus,
  ArrowUpDown,
  DollarSign,
  AlertCircle,
  Printer,
  LayoutList,
  Rows
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SEED_NXT_RECORDS, NXTRecord } from './nxtData';

interface AutoNXTTableProps {
  branchId?: number;
  branchName?: string;
}

export const AutoNXTTable: React.FC<AutoNXTTableProps> = ({
  branchId = 1,
  branchName = 'Sen Việt Thái Nguyên'
}) => {
  // Data state
  const [records, setRecords] = useState<NXTRecord[]>(SEED_NXT_RECORDS);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(branchId);

  // TASK-PC-05: Chế độ Compact Density Mode (32px vs 48px)
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [lossOnly, setLossOnly] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // TASK-PC-07: Phím tắt PC (F2 hoặc / focus ô tìm kiếm, Escape hủy)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' || (e.key === '/' && document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (showAddModal) setShowAddModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Configurable guest count for dynamic re-calculation
  const [totalGuests, setTotalGuests] = useState<number>(selectedBranchId === 1 ? 1529.5 : 1245);

  // Modal thêm/sửa dòng NXT
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newItem, setNewItem] = useState({
    itemCode: '',
    itemName: '',
    unit: 'Kg',
    costCategory: 'THỰC PHẨM',
    subCategory: 'HS Chính',
    openingStockQty: 0,
    openingStockAmount: 0,
    importedQty: 0,
    importedAmount: 0,
    exportedQty: 0,
    exportedAmount: 0,
    avgPrice: 200000,
    theoreticalNormPerGuest: 0.15,
  });

  // Unique categories for filter dropdown
  const categories = useMemo(() => {
    const set = new Set<string>();
    records
      .filter((r) => r.branchId === selectedBranchId)
      .forEach((r) => {
        if (r.costCategory) set.add(r.costCategory);
      });
    return Array.from(set);
  }, [records, selectedBranchId]);

  // Recalculate and filter records based on current totalGuests and filters
  const processedRecords = useMemo(() => {
    return records
      .filter((r) => r.branchId === selectedBranchId)
      .map((r) => {
        // Tồn cuối = Tồn đầu + Nhập - Xuất
        const closingStockQty = Number((r.openingStockQty + r.importedQty - r.exportedQty).toFixed(2));
        const closingStockAmount = Math.round(r.openingStockAmount + r.importedAmount - r.exportedAmount);

        // Tỷ lệ thực tế = Tổng xuất / Tổng suất ăn
        const actualUsagePerGuest = totalGuests > 0 ? Number((r.exportedQty / totalGuests).toFixed(4)) : 0;
        const actualUsagePerGuestAmount = totalGuests > 0 ? Math.round(r.exportedAmount / totalGuests) : 0;

        // Tỷ lệ lý thuyết (Tổng tiêu hao lý thuyết = Định mức * Tổng suất ăn * Giá TB)
        const theoreticalTotalAmount =
          r.theoreticalNormPerGuest > 0
            ? Math.round(r.theoreticalNormPerGuest * totalGuests * r.avgPrice)
            : r.theoreticalTotalAmount;

        // So sánh: Lệch 1 người = Định mức lý thuyết - Thực tế
        // Lưu ý: Nếu định mức = 0.262 và thực tế = 0.294 => Lệch = -0.032 (âm nghĩa là xuất nhiều hơn định mức -> thất thoát)
        const diffPerGuest =
          r.theoreticalNormPerGuest > 0
            ? Number((r.theoreticalNormPerGuest - actualUsagePerGuest).toFixed(4))
            : -actualUsagePerGuest;

        // Lệch tiền tổng = Tiêu hao lý thuyết - Xuất thực tế (âm nghĩa là vượt chi ngân sách)
        const diffTotalAmount =
          theoreticalTotalAmount > 0 ? theoreticalTotalAmount - r.exportedAmount : -r.exportedAmount;

        // Tự động tô đỏ cảnh báo nếu chênh lệch âm vượt ngưỡng (thất thoát)
        const isLossWarning =
          (diffPerGuest < -0.003 && Math.abs(diffTotalAmount) > 200000) || diffTotalAmount < -300000;

        return {
          ...r,
          closingStockQty,
          closingStockAmount,
          actualUsagePerGuest,
          actualUsagePerGuestAmount,
          theoreticalTotalAmount,
          diffPerGuest,
          diffTotalAmount,
          isLossWarning,
        };
      })
      .filter((r) => {
        if (selectedCategory !== 'ALL' && r.costCategory !== selectedCategory) return false;
        if (lossOnly && !r.isLossWarning) return false;
        if (searchTerm.trim()) {
          const s = searchTerm.toLowerCase();
          return (
            r.itemCode.toLowerCase().includes(s) ||
            r.itemName.toLowerCase().includes(s) ||
            (r.subCategory && r.subCategory.toLowerCase().includes(s))
          );
        }
        return true;
      });
  }, [records, selectedBranchId, totalGuests, selectedCategory, lossOnly, searchTerm]);

  // Aggregate stats
  const stats = useMemo(() => {
    const list = processedRecords;
    const totalOpeningAmount = list.reduce((s, r) => s + r.openingStockAmount, 0);
    const totalImportedAmount = list.reduce((s, r) => s + r.importedAmount, 0);
    const totalExportedAmount = list.reduce((s, r) => s + r.exportedAmount, 0);
    const totalClosingAmount = list.reduce((s, r) => s + r.closingStockAmount, 0);
    const totalLossAmount = list
      .filter((r) => r.diffTotalAmount < 0)
      .reduce((s, r) => s + Math.abs(r.diffTotalAmount), 0);
    const redAlertCount = list.filter((r) => r.isLossWarning).length;

    return {
      totalOpeningAmount,
      totalImportedAmount,
      totalExportedAmount,
      totalClosingAmount,
      totalLossAmount,
      redAlertCount,
      totalItems: list.length,
    };
  }, [processedRecords]);

  // Handle branch switch
  const handleSwitchBranch = (id: number) => {
    setSelectedBranchId(id);
    setTotalGuests(id === 1 ? 1529.5 : 1245);
  };

  // Add new item into NXT list
  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.itemCode || !newItem.itemName) return;

    const closingStockQty = Number(
      (newItem.openingStockQty + newItem.importedQty - newItem.exportedQty).toFixed(2)
    );
    const closingStockAmount = Math.round(
      newItem.openingStockAmount + newItem.importedAmount - newItem.exportedAmount
    );
    const actualNorm = totalGuests > 0 ? Number((newItem.exportedQty / totalGuests).toFixed(4)) : 0;
    const theoTotal = Math.round(newItem.theoreticalNormPerGuest * totalGuests * newItem.avgPrice);
    const diffNorm = Number((newItem.theoreticalNormPerGuest - actualNorm).toFixed(4));
    const diffTotal = theoTotal - newItem.exportedAmount;

    const record: NXTRecord = {
      id: Date.now(),
      stt: records.length + 1,
      itemCode: newItem.itemCode.toUpperCase(),
      itemName: newItem.itemName,
      unit: newItem.unit,
      costCategory: newItem.costCategory,
      subCategory: newItem.subCategory,
      branchId: selectedBranchId,
      branchName: selectedBranchId === 1 ? 'Sen Việt Thái Nguyên' : 'Sen Việt Quế Võ',
      openingStockQty: newItem.openingStockQty,
      openingStockAmount: newItem.openingStockAmount,
      importedQty: newItem.importedQty,
      importedAmount: newItem.importedAmount,
      exportedQty: newItem.exportedQty,
      exportedAmount: newItem.exportedAmount,
      closingStockQty,
      closingStockAmount,
      avgPrice: newItem.avgPrice,
      theoreticalNormPerGuest: newItem.theoreticalNormPerGuest,
      theoreticalTotalAmount: theoTotal,
      actualUsagePerGuest: actualNorm,
      actualUsagePerGuestAmount: totalGuests > 0 ? Math.round(newItem.exportedAmount / totalGuests) : 0,
      diffPerGuest: diffNorm,
      diffTotalAmount: diffTotal,
      isLossWarning: diffNorm < -0.003 || diffTotal < -300000,
    };

    setRecords([record, ...records]);
    setShowAddModal(false);
    setNewItem({
      itemCode: '',
      itemName: '',
      unit: 'Kg',
      costCategory: 'THỰC PHẨM',
      subCategory: 'HS Chính',
      openingStockQty: 0,
      openingStockAmount: 0,
      importedQty: 0,
      importedAmount: 0,
      exportedQty: 0,
      exportedAmount: 0,
      avgPrice: 200000,
      theoreticalNormPerGuest: 0.15,
    });
  };

  // Export full NXT Excel sheet matching restaurant template
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const titleRow = [
      `BẢNG TỔNG HỢP NHẬP - XUẤT - TỒN ĐỊNH LƯỢNG - ${
        selectedBranchId === 1 ? 'CHI NHÁNH THÁI NGUYÊN' : 'CHI NHÁNH QUẾ VÕ'
      }`,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'Số lượng khách bình quân',
      totalGuests,
    ];

    const groupHeader = [
      '',
      '',
      '',
      '',
      '',
      '',
      'TỒN ĐẦU KỲ',
      '',
      'NHẬP TRONG KỲ',
      '',
      'XUẤT TRONG KỲ',
      '',
      'TỒN CUỐI KỲ',
      '',
      'GIÁ BÌNH QUÂN',
      'TỶ LỆ LÝ THUYẾT',
      '',
      'TỶ LỆ THỰC TẾ',
      '',
      'SO SÁNH (LÝ THUYẾT - TT)',
      '',
      'CẢNH BÁO THẤT THOÁT',
    ];

    const subHeader = [
      'STT',
      'MÃ HÀNG',
      'TÊN HÀNG',
      'ĐVT',
      'LOẠI CHI PHÍ',
      'PHÂN NHÓM',
      'SL',
      'THÀNH TIỀN (đ)',
      'SL',
      'THÀNH TIỀN (đ)',
      'SL',
      'THÀNH TIỀN (đ)',
      'SL (Đầu+Nhập-Xuất)',
      'THÀNH TIỀN (đ)',
      'ĐƠN GIÁ (đ)',
      '1 NGƯỜI (kg)',
      'TỔNG TIÊU HAO (đ)',
      '1 NGƯỜI (kg)',
      '1 NGƯỜI ĂN HẾT (đ)',
      'LỆCH 1 NGƯỜI (kg)',
      'LỆCH TỔNG TIỀN (đ)',
      'TRẠNG THÁI',
    ];

    const dataRows = processedRecords.map((r, idx) => [
      idx + 1,
      r.itemCode,
      r.itemName,
      r.unit,
      r.costCategory,
      r.subCategory || '',
      r.openingStockQty,
      r.openingStockAmount,
      r.importedQty,
      r.importedAmount,
      r.exportedQty,
      r.exportedAmount,
      r.closingStockQty,
      r.closingStockAmount,
      r.avgPrice,
      r.theoreticalNormPerGuest,
      r.theoreticalTotalAmount,
      r.actualUsagePerGuest,
      r.actualUsagePerGuestAmount,
      r.diffPerGuest,
      r.diffTotalAmount,
      r.isLossWarning ? '⚠️ THẤT THOÁT (BÁO ĐỎ)' : '✓ ĐẠT ĐỊNH MỨC',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([titleRow, groupHeader, subHeader, ...dataRows]);
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      `NXT_${selectedBranchId === 1 ? 'ThaiNguyen' : 'QueVo'}`
    );
    XLSX.writeFile(
      wb,
      `Bang_NXT_DinhLuong_${selectedBranchId === 1 ? 'ThaiNguyen' : 'QueVo'}_T11_2026.xlsx`
    );
  };

  return (
    <div className="space-y-5">
      {/* HEADER CONTROLS & BRANCH SWITCHER */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Chuẩn Nghiệp Vụ Sheet NXT Nhà Hàng (TASK-S4-01)</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>Bảng Nhập - Xuất - Tồn & Đối Soát Định Lượng Tự Động</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Công thức: <strong className="text-slate-800">Tồn cuối = Tồn đầu + Nhập - Xuất</strong> | So sánh{' '}
            <strong className="text-indigo-600">Lý thuyết</strong> (định mức × {totalGuests} khách) vs{' '}
            <strong className="text-blue-600">Thực tế</strong> (tổng xuất / khách). Tô đỏ cảnh báo thất thoát âm.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleSwitchBranch(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedBranchId === 1
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thái Nguyên (TN)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchBranch(2)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedBranchId === 2
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quế Võ (QV)
            </button>
          </div>

          {/* Dynamic guest count input */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span>Suất ăn TB:</span>
            <input
              type="number"
              step="0.5"
              min="1"
              value={totalGuests}
              onChange={(e) => setTotalGuests(parseFloat(e.target.value) || 1)}
              className="w-16 px-1.5 py-0.5 border border-slate-300 rounded font-mono text-center text-xs bg-white text-indigo-700 font-bold"
            />
          </div>

          {/* TASK-PC-05: Chế độ hiển thị Compact vs Comfortable */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              title="Chế độ tiêu chuẩn (48px/hàng)"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                density === 'comfortable'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutList className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Tiêu chuẩn (48px)</span>
            </button>
            <button
              type="button"
              onClick={() => setDensity('compact')}
              title="Chế độ cô đọng (32px/hàng - xem nhiều dòng dữ liệu)"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                density === 'compact'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Rows className="h-3.5 w-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Cô đọng (32px)</span>
            </button>
          </div>

          {/* TASK-PC-08: In A4 Landscape */}
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-touch px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            title="In ấn khổ A4 Landscape (Ctrl+P)"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">In A4 Ngang</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-touch px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm Dòng NXT</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="btn-touch px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <Download className="h-4 w-4" />
            <span>Xuất Excel NXT (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Tồn Đầu Kỳ</div>
          <div className="text-base sm:text-lg font-black font-mono text-slate-800 mt-1">
            {stats.totalOpeningAmount.toLocaleString('vi-VN')} <span className="text-[10px] font-normal text-slate-500">đ</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">Nhập Trong Kỳ</div>
          <div className="text-base sm:text-lg font-black font-mono text-emerald-700 mt-1">
            {stats.totalImportedAmount.toLocaleString('vi-VN')} <span className="text-[10px] font-normal text-slate-500">đ</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">Xuất Trong Kỳ</div>
          <div className="text-base sm:text-lg font-black font-mono text-blue-700 mt-1">
            {stats.totalExportedAmount.toLocaleString('vi-VN')} <span className="text-[10px] font-normal text-slate-500">đ</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide">Tồn Cuối Kỳ</div>
          <div className="text-base sm:text-lg font-black font-mono text-indigo-700 mt-1">
            {stats.totalClosingAmount.toLocaleString('vi-VN')} <span className="text-[10px] font-normal text-slate-500">đ</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 shadow-sm">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wide flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            <span>Thất Thoát Âm</span>
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-rose-700 mt-1">
            -{stats.totalLossAmount.toLocaleString('vi-VN')} <span className="text-[10px] font-normal text-rose-500">đ</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Món Báo Đỏ</div>
          <div className="text-base sm:text-lg font-black font-mono text-rose-600 mt-1 flex items-center gap-1">
            <span>{stats.redAlertCount}</span>
            <span className="text-xs font-normal text-slate-500">/ {stats.totalItems} món</span>
          </div>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search box (TASK-PC-07: F2 hoặc / để focus) */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm theo mã hàng, tên hàng... (F2 hoặc /)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="ALL">Tất cả nhóm chi phí</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loss alert toggle */}
        <button
          type="button"
          onClick={() => setLossOnly(!lossOnly)}
          className={`btn-touch px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
            lossOnly
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
          }`}
        >
          <AlertTriangle className={`h-4 w-4 ${lossOnly ? 'text-white' : 'text-rose-600'}`} />
          <span>{lossOnly ? 'Đang lọc: Chỉ món thất thoát âm' : 'Chỉ xem món thất thoát (Báo đỏ)'}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              lossOnly ? 'bg-white text-rose-700' : 'bg-rose-600 text-white'
            }`}
          >
            {stats.redAlertCount} món
          </span>
        </button>
      </div>

      {/* KHỐI TIÊU ĐỀ IN ẤN (CHỈ XUẤT HIỆN KHI IN KHỔ A4 LANDSCAPE) */}
      <div className="hidden print:block mb-4 text-center">
        <div className="font-extrabold text-xs uppercase text-slate-600">
          CÔNG TY T&T NGUYỄN DƯƠNG — HỆ THỐNG BUFFET SEN VIỆT
        </div>
        <div className="font-black text-base uppercase text-slate-900 mt-1">
          BẢNG TỔNG HỢP NHẬP - XUẤT - TỒN & ĐỐI SOÁT ĐỊNH LƯỢNG
        </div>
        <div className="text-xs text-slate-600 mt-0.5">
          {selectedBranchId === 1 ? 'Chi nhánh Thái Nguyên' : 'Chi nhánh Quế Võ'} • Tháng 11/2026 (18 ngày đối soát thật)
        </div>
      </div>

      {/* MASTER NXT TABLE (TASK-PC-04: Freeze Columns, Sticky Header & TASK-PC-05: Density) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-270px)] relative">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-30 shadow-sm">
              {/* Group header row */}
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600">
                <th colSpan={3} className="p-2 border-r border-slate-300 text-center bg-slate-200/90 sticky left-0 z-40">
                  Thông Tin Mặt Hàng
                </th>
                <th className="p-2 border-r border-slate-200 text-center bg-slate-100">
                  ĐVT
                </th>
                <th colSpan={2} className="p-2 border-r border-slate-200 text-center bg-slate-100">
                  Phân Loại
                </th>
                <th colSpan={2} className="p-2 border-r border-slate-200 text-center bg-slate-200/70">
                  1. Tồn Đầu Kỳ
                </th>
                <th colSpan={2} className="p-2 border-r border-slate-200 text-center bg-emerald-50 text-emerald-800">
                  2. Nhập Trong Kỳ
                </th>
                <th colSpan={2} className="p-2 border-r border-slate-200 text-center bg-blue-50 text-blue-800">
                  3. Xuất Trong Kỳ
                </th>
                <th colSpan={2} className="p-2 border-r border-slate-200 text-center bg-indigo-50 text-indigo-900 font-black">
                  4. Tồn Cuối (Đầu+Nhập-Xuất)
                </th>
                <th className="p-2 border-r border-slate-200 text-right bg-slate-100">
                  Giá TB
                </th>
                <th colSpan={2} className="p-2 border-r border-slate-200 text-center bg-purple-50 text-purple-900">
                  5. Tỷ Lệ Lý Thuyết
                </th>
                <th colSpan={2} className="p-2 border-r border-slate-200 text-center bg-sky-50 text-sky-900">
                  6. Tỷ Lệ Thực Tế
                </th>
                <th colSpan={2} className="p-2 text-center bg-rose-100 text-rose-900 font-black sticky right-0 z-40 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  7. So Sánh (Thất Thoát Âm)
                </th>
              </tr>

              {/* Sub-header row */}
              <tr className="border-b border-slate-300 text-[10px] text-slate-500 bg-slate-50">
                <th className="py-2 px-1.5 w-12 text-center sticky left-0 z-40 bg-slate-100">STT</th>
                <th className="py-2 px-2 w-24 sticky left-12 z-40 bg-slate-100">Mã hàng</th>
                <th className="py-2 px-2 min-w-[170px] sticky left-36 z-40 bg-slate-100 border-r border-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Tên mặt hàng
                </th>
                <th className="py-2 px-1.5 w-12 text-center border-r border-slate-200">ĐVT</th>
                <th className="py-2 px-2">Loại CP</th>
                <th className="py-2 px-2 border-r border-slate-200">Phân nhóm</th>

                {/* Tồn đầu */}
                <th className="py-2 px-2 text-right">SL</th>
                <th className="py-2 px-2 text-right border-r border-slate-200">Thành tiền (đ)</th>

                {/* Nhập */}
                <th className="py-2 px-2 text-right bg-emerald-50/50">SL</th>
                <th className="py-2 px-2 text-right bg-emerald-50/50 border-r border-slate-200">Thành tiền (đ)</th>

                {/* Xuất */}
                <th className="py-2 px-2 text-right bg-blue-50/50">SL</th>
                <th className="py-2 px-2 text-right bg-blue-50/50 border-r border-slate-200">Thành tiền (đ)</th>

                {/* Tồn cuối */}
                <th className="py-2 px-2 text-right font-black text-indigo-900 bg-indigo-50/60">SL</th>
                <th className="py-2 px-2 text-right font-black text-indigo-900 bg-indigo-50/60 border-r border-slate-200">
                  Thành tiền (đ)
                </th>

                {/* Giá TB */}
                <th className="py-2 px-2 text-right font-mono border-r border-slate-200">Đơn giá</th>

                {/* Lý thuyết */}
                <th className="py-2 px-2 text-right bg-purple-50/40">1 Người (kg)</th>
                <th className="py-2 px-2 text-right bg-purple-50/40 border-r border-slate-200">Tổng tiêu hao (đ)</th>

                {/* Thực tế */}
                <th className="py-2 px-2 text-right bg-sky-50/40">1 Người (kg)</th>
                <th className="py-2 px-2 text-right bg-sky-50/40 border-r border-slate-200">1 Khách ăn (đ)</th>

                {/* So sánh */}
                <th className="py-2 px-2 text-right bg-rose-50 font-bold">Lệch kg/người</th>
                <th className="py-2 px-2 text-right bg-rose-100 font-black text-rose-900 sticky right-0 z-40 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Lệch tổng tiền (đ)
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {processedRecords.length === 0 ? (
                <tr>
                  <td colSpan={22} className="p-12 text-center text-slate-400">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-sm">Không tìm thấy dữ liệu mặt hàng nào phù hợp với bộ lọc</p>
                  </td>
                </tr>
              ) : (
                processedRecords.map((r, idx) => {
                  const isRed = r.isLossWarning;
                  const cellP = density === 'compact' ? 'py-1 px-2 text-[11px]' : 'py-2.5 px-3 text-xs';

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50 transition-colors group ${
                        isRed ? 'bg-rose-50/60 text-slate-900 font-semibold' : ''
                      }`}
                    >
                      {/* Cột 1: STT (Freeze left-0) */}
                      <td
                        className={`${cellP} text-center font-mono text-[11px] sticky left-0 z-20 w-12 ${
                          isRed ? 'bg-rose-50 text-slate-600' : 'bg-white group-hover:bg-slate-50 text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </td>

                      {/* Cột 2: Mã hàng (Freeze left-12) */}
                      <td
                        className={`${cellP} font-mono font-bold sticky left-12 z-20 w-24 ${
                          isRed ? 'bg-rose-50 text-slate-900' : 'bg-white group-hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        {r.itemCode}
                      </td>

                      {/* Cột 3: Tên mặt hàng (Freeze left-36) */}
                      <td
                        className={`${cellP} sticky left-36 z-20 border-r border-slate-300 font-bold min-w-[170px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                          isRed ? 'bg-rose-50 text-rose-950' : 'bg-white group-hover:bg-slate-50 text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {isRed && (
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-600 flex-shrink-0 animate-pulse" />
                          )}
                          <span className="truncate">{r.itemName}</span>
                        </div>
                      </td>

                      <td className={`${cellP} text-center text-slate-500 font-mono text-[11px] border-r border-slate-200`}>
                        {r.unit}
                      </td>
                      <td className={`${cellP} text-[11px] text-slate-600`}>{r.costCategory}</td>
                      <td className={`${cellP} text-[11px] text-slate-500 border-r border-slate-200`}>
                        {r.subCategory || '—'}
                      </td>

                      {/* 1. Tồn đầu */}
                      <td className={`${cellP} text-right font-mono font-semibold`}>
                        {r.openingStockQty > 0 ? r.openingStockQty.toLocaleString('vi-VN') : '0'}
                      </td>
                      <td className={`${cellP} text-right font-mono text-slate-600 border-r border-slate-200`}>
                        {r.openingStockAmount > 0 ? r.openingStockAmount.toLocaleString('vi-VN') : '0'}
                      </td>

                      {/* 2. Nhập */}
                      <td className={`${cellP} text-right font-mono font-bold text-emerald-700 bg-emerald-50/20`}>
                        {r.importedQty > 0 ? r.importedQty.toLocaleString('vi-VN') : '0'}
                      </td>
                      <td className={`${cellP} text-right font-mono text-emerald-800 bg-emerald-50/20 border-r border-slate-200`}>
                        {r.importedAmount > 0 ? r.importedAmount.toLocaleString('vi-VN') : '0'}
                      </td>

                      {/* 3. Xuất */}
                      <td className={`${cellP} text-right font-mono font-bold text-blue-700 bg-blue-50/20`}>
                        {r.exportedQty > 0 ? r.exportedQty.toLocaleString('vi-VN') : '0'}
                      </td>
                      <td className={`${cellP} text-right font-mono text-blue-800 bg-blue-50/20 border-r border-slate-200`}>
                        {r.exportedAmount > 0 ? r.exportedAmount.toLocaleString('vi-VN') : '0'}
                      </td>

                      {/* 4. Tồn cuối = Đầu + Nhập - Xuất */}
                      <td className={`${cellP} text-right font-mono font-black text-indigo-700 bg-indigo-50/30`}>
                        {r.closingStockQty.toLocaleString('vi-VN')}
                      </td>
                      <td className={`${cellP} text-right font-mono font-black text-indigo-900 bg-indigo-50/30 border-r border-slate-200`}>
                        {r.closingStockAmount.toLocaleString('vi-VN')}
                      </td>

                      {/* Giá TB */}
                      <td className={`${cellP} text-right font-mono text-slate-700 border-r border-slate-200`}>
                        {r.avgPrice.toLocaleString('vi-VN')}
                      </td>

                      {/* 5. Lý thuyết */}
                      <td className={`${cellP} text-right font-mono text-purple-700 bg-purple-50/20`}>
                        {r.theoreticalNormPerGuest > 0 ? r.theoreticalNormPerGuest.toFixed(3) : '—'}
                      </td>
                      <td className={`${cellP} text-right font-mono text-purple-900 bg-purple-50/20 border-r border-slate-200`}>
                        {r.theoreticalTotalAmount > 0 ? r.theoreticalTotalAmount.toLocaleString('vi-VN') : '—'}
                      </td>

                      {/* 6. Thực tế */}
                      <td className={`${cellP} text-right font-mono text-sky-700 bg-sky-50/20`}>
                        {r.actualUsagePerGuest > 0 ? r.actualUsagePerGuest.toFixed(3) : '—'}
                      </td>
                      <td className={`${cellP} text-right font-mono text-sky-900 bg-sky-50/20 border-r border-slate-200`}>
                        {r.actualUsagePerGuestAmount > 0
                          ? r.actualUsagePerGuestAmount.toLocaleString('vi-VN')
                          : '—'}
                      </td>

                      {/* 7. So sánh (Lệch âm là vượt định mức / thất thoát) */}
                      <td
                        className={`${cellP} text-right font-mono font-bold ${
                          r.diffPerGuest < 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {r.diffPerGuest !== 0 ? (r.diffPerGuest > 0 ? `+${r.diffPerGuest.toFixed(3)}` : r.diffPerGuest.toFixed(3)) : '0.000'}
                      </td>

                      {/* Cột Cuối: Lệch Tổng Tiền (Freeze right-0) */}
                      <td
                        className={`${cellP} text-right font-mono font-black sticky right-0 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                          r.diffTotalAmount < 0
                            ? 'text-rose-700 bg-rose-100 font-black'
                            : 'text-emerald-700 bg-white group-hover:bg-slate-50'
                        }`}
                      >
                        {r.diffTotalAmount < 0 ? (
                          <span className="flex items-center justify-end gap-1">
                            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px]">LỆCH</span>
                            <span>{r.diffTotalAmount.toLocaleString('vi-VN')} đ</span>
                          </span>
                        ) : (
                          <span>+{r.diffTotalAmount.toLocaleString('vi-VN')} đ</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4 Ô CHỮ KÝ CHUẨN A4 LANDSCAPE (TASK-PC-08) */}
      <div className="hidden print:grid grid-cols-4 gap-4 mt-8 pt-4 border-t border-slate-300 text-center text-xs print-avoid-break">
        <div className="space-y-1">
          <span className="font-bold block uppercase text-slate-800">Người Lập Biểu</span>
          <span className="text-[10px] text-slate-500 italic block">(Ký, ghi rõ họ tên)</span>
          <div className="h-16" />
          <span className="font-bold text-slate-700">Kế toán kho</span>
        </div>
        <div className="space-y-1">
          <span className="font-bold block uppercase text-slate-800">Thủ Kho</span>
          <span className="text-[10px] text-slate-500 italic block">(Ký, ghi rõ họ tên)</span>
          <div className="h-16" />
          <span className="font-bold text-slate-700">Thủ kho chi nhánh</span>
        </div>
        <div className="space-y-1">
          <span className="font-bold block uppercase text-slate-800">Kế Toán Trưởng</span>
          <span className="text-[10px] text-slate-500 italic block">(Ký, ghi rõ họ tên)</span>
          <div className="h-16" />
          <span className="font-bold text-slate-700">Vũ Thủy</span>
        </div>
        <div className="space-y-1">
          <span className="font-bold block uppercase text-slate-800">Giám Đốc Duyệt</span>
          <span className="text-[10px] text-slate-500 italic block">(Ký, đóng dấu)</span>
          <div className="h-16" />
          <span className="font-bold text-slate-700">Ban Giám Đốc Sen Việt</span>
        </div>
      </div>

      {/* MODAL: THÊM DÒNG NXT MỚI */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-600" />
                <span>Thêm Dòng Mặt Hàng Nhập - Xuất - Tồn</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mã Hàng (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: TNCUA, TNGHE..."
                    value={newItem.itemCode}
                    onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tên Mặt Hàng (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cua Thịt Cà Mau..."
                    value={newItem.itemName}
                    onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Đơn vị tính</label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="Kg">Kg</option>
                    <option value="Túi">Túi</option>
                    <option value="Lọ">Lọ</option>
                    <option value="Hộp">Hộp</option>
                    <option value="Cái">Cái</option>
                    <option value="Lon">Lon</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Loại Chi Phí</label>
                  <select
                    value={newItem.costCategory}
                    onChange={(e) => setNewItem({ ...newItem, costCategory: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="THỰC PHẨM">THỰC PHẨM</option>
                    <option value="GIA VỊ">GIA VỊ</option>
                    <option value="TIÊU HAO">TIÊU HAO</option>
                    <option value="ĐỒ ĂN NHÂN VIÊN">ĐỒ ĂN NHÂN VIÊN</option>
                    <option value="ĐỒ UỐNG">ĐỒ UỐNG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phân Nhóm</label>
                  <input
                    type="text"
                    placeholder="HS Chính, Thịt, Rau..."
                    value={newItem.subCategory}
                    onChange={(e) => setNewItem({ ...newItem, subCategory: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Số Liệu Đầu Vào (Tồn đầu, Nhập, Xuất)
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <span className="block text-[10px] text-slate-500 font-semibold mb-0.5">Tồn Đầu SL</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={newItem.openingStockQty}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          openingStockQty: parseFloat(e.target.value) || 0,
                          openingStockAmount: (parseFloat(e.target.value) || 0) * newItem.avgPrice,
                        })
                      }
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 font-semibold mb-0.5">Nhập SL</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={newItem.importedQty}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          importedQty: parseFloat(e.target.value) || 0,
                          importedAmount: (parseFloat(e.target.value) || 0) * newItem.avgPrice,
                        })
                      }
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 font-semibold mb-0.5">Xuất SL</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={newItem.exportedQty}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          exportedQty: parseFloat(e.target.value) || 0,
                          exportedAmount: (parseFloat(e.target.value) || 0) * newItem.avgPrice,
                        })
                      }
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                      Đơn giá bình quân (đ)
                    </span>
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      value={newItem.avgPrice}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          avgPrice: parseFloat(e.target.value) || 0,
                          openingStockAmount: newItem.openingStockQty * (parseFloat(e.target.value) || 0),
                          importedAmount: newItem.importedQty * (parseFloat(e.target.value) || 0),
                          exportedAmount: newItem.exportedQty * (parseFloat(e.target.value) || 0),
                        })
                      }
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                      Định mức lý thuyết (kg/khách)
                    </span>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={newItem.theoreticalNormPerGuest}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          theoreticalNormPerGuest: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                {/* Auto Calculated Closing Stock preview */}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-800">
                  <span>Tồn cuối tự động (Đầu + Nhập - Xuất):</span>
                  <span className="text-indigo-700 font-mono text-sm">
                    {(newItem.openingStockQty + newItem.importedQty - newItem.exportedQty).toFixed(2)}{' '}
                    {newItem.unit} (
                    {(
                      newItem.openingStockAmount +
                      newItem.importedAmount -
                      newItem.exportedAmount
                    ).toLocaleString('vi-VN')}{' '}
                    đ)
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md shadow-indigo-600/20"
                >
                  Lưu Dòng NXT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
