import React, { useState, useEffect, useMemo } from 'react';
import {
  UtensilsCrossed,
  Flame,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Edit3,
  SlidersHorizontal,
  ChefHat,
  Sparkles,
  PackageCheck,
  TrendingDown,
  Info,
  X,
  Building2,
} from 'lucide-react';
import { warehouseApi } from '../../api/warehouse';
import { ProcessedDish } from '../../db/schema';
import { useNotification } from '../../context/NotificationContext';

interface ProcessedDishesTabProps {
  branchId?: number;
  branchCode?: string;
  isKitchen?: boolean;
}

export const ProcessedDishesTab: React.FC<ProcessedDishesTabProps> = ({
  branchId,
  branchCode,
  isKitchen = false,
}) => {
  const { showSuccess, showError } = useNotification();
  const [dishes, setDishes] = useState<ProcessedDish[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(
    branchCode || 'ALL'
  );

  // Modal điều chỉnh số lượng tồn đĩa thủ công
  const [editingDish, setEditingDish] = useState<ProcessedDish | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Kiểm kê đĩa thực tế đầu ca');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState<boolean>(false);

  // Load danh sách món ăn từ database
  const loadDishes = async () => {
    setIsLoading(true);
    try {
      const data = await warehouseApi.getProcessedDishes();
      setDishes(data);
    } catch (err: any) {
      showError('Không thể nạp danh sách Kho Sau Chế Biến: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDishes();
  }, []);

  // Các nhóm món ăn hoàn chỉnh
  const categories = [
    { id: 'ALL', name: 'Tất cả món ăn' },
    { id: 'Món Nướng', name: 'Món Nướng' },
    { id: 'Món Hấp', name: 'Món Hấp' },
    { id: 'Món Nóng', name: 'Món Nóng & Xào' },
    { id: 'Món Lạnh', name: 'Món Lạnh & Khai Vị' },
    { id: 'Tráng Miệng', name: 'Tráng Miệng' },
  ];

  // Lọc dữ liệu
  const filteredDishes = useMemo(() => {
    return dishes.filter((d) => {
      // Lọc chi nhánh
      if (selectedBranchFilter !== 'ALL') {
        const matchesBranch =
          (selectedBranchFilter === 'QV' && (d.branchCode === 'QV' || d.branchId === 2)) ||
          (selectedBranchFilter === 'TN' && (d.branchCode === 'TN' || d.branchId === 1));
        if (!matchesBranch) return false;
      }

      // Lọc danh mục
      if (selectedCategory !== 'ALL') {
        if (!d.category.toLowerCase().includes(selectedCategory.toLowerCase())) {
          return false;
        }
      }

      // Tìm kiếm từ khóa
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesName = d.dishName.toLowerCase().includes(q);
        const matchesCode = d.dishCode.toLowerCase().includes(q);
        const matchesRaw = d.rawItemName ? d.rawItemName.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesCode && !matchesRaw) return false;
      }

      return true;
    });
  }, [dishes, selectedBranchFilter, selectedCategory, searchTerm]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const totalDishes = filteredDishes.length;
    const totalPlates = filteredDishes.reduce((sum, d) => sum + (d.quantity || 0), 0);
    const readyDishes = filteredDishes.filter((d) => (d.quantity || 0) >= 5).length;
    const lowOrOutDishes = filteredDishes.filter((d) => (d.quantity || 0) < 5).length;
    return { totalDishes, totalPlates, readyDishes, lowOrOutDishes };
  }, [filteredDishes]);

  // Tìm món Hàu nướng mỡ hành làm ví dụ minh họa nổi bật
  const hauNuongDish = useMemo(() => {
    return filteredDishes.find((d) => d.dishName.toLowerCase().includes('hàu'));
  }, [filteredDishes]);

  // Xử lý mở modal điều chỉnh
  const handleOpenAdjust = (dish: ProcessedDish) => {
    setEditingDish(dish);
    setAdjustQuantity(dish.quantity);
    setAdjustReason('Kiểm kê đĩa thực tế đầu ca');
  };

  // Xác nhận điều chỉnh số lượng
  const handleConfirmAdjust = async () => {
    if (!editingDish) return;
    setIsSubmittingAdjust(true);
    try {
      await warehouseApi.updateProcessedDish(editingDish.id, {
        quantity: Math.max(0, Number(adjustQuantity)),
      });
      showSuccess(
        `Đã cập nhật tồn kho món "${editingDish.dishName}" thành ${adjustQuantity} ${editingDish.unit}`
      );
      setEditingDish(null);
      await loadDishes();
    } catch (err: any) {
      showError('Lỗi cập nhật: ' + err.message);
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. GIẢI THÍCH LUỒNG KHO 2 TẦNG (INVENTORY FLOW BANNER) */}
      <div className="bg-gradient-to-r from-amber-900/40 via-slate-900 to-indigo-950 p-5 rounded-3xl border border-amber-500/30 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black tracking-wider uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              TẦNG 2: KHO SAU CHẾ BIẾN (MÓN ĂN THÀNH PHẨM BUFFET)
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Quản Lý Tồn Món Ăn Nấu Chín Sẵn Sàng Ra Line
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Các món ăn thành phẩm hoàn chỉnh (như <span className="text-amber-300 font-bold">Hàu nướng mỡ hành</span>, <span className="text-amber-300 font-bold">Cua sốt me</span>, <span className="text-amber-300 font-bold">Ghẹ hấp sả</span>...) được lưu trữ và đếm theo <strong>Đĩa / Khay / Kg</strong>. Tự động tăng khi Bếp hoàn tất <strong>Nút 2 (Cân mẻ)</strong> và tự động trừ khi nhân viên bấm <strong>Nút 3 (Ra line buffet)</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/70 p-3 rounded-2xl border border-white/10 shrink-0 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Đồng bộ thời gian thực với quầy Bếp</span>
            </div>
            <button
              onClick={loadDishes}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              title="Làm mới số liệu"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Chuỗi liên kết nghiệp vụ */}
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] font-semibold text-slate-300">
          <div className="flex items-center gap-2 bg-black/30 p-2 rounded-xl">
            <span className="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold">1</span>
            <span>Kho trước chế biến (Thịt, Rau, Hàu sống...)</span>
          </div>
          <div className="flex items-center gap-2 bg-black/30 p-2 rounded-xl">
            <span className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-300 flex items-center justify-center font-bold">2</span>
            <span>Nút 1: Lấy hàng & Chế biến</span>
          </div>
          <div className="flex items-center gap-2 bg-black/30 p-2 rounded-xl border border-amber-400/40 text-amber-200">
            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold">3</span>
            <span>Nút 2: Cân mẻ ➔ TĂNG KHO NÀY</span>
          </div>
          <div className="flex items-center gap-2 bg-black/30 p-2 rounded-xl border border-emerald-400/40 text-emerald-200">
            <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center font-bold">4</span>
            <span>Nút 3: Ra Line ➔ TRỪ KHO NÀY</span>
          </div>
        </div>
      </div>

      {/* 2. THẺ VÍ DỤ NỔI BẬT: HÀU NƯỚNG MỠ HÀNH & MÓN CHỦ LỰC */}
      {hauNuongDish && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 p-4 sm:p-5 rounded-3xl border-2 border-emerald-300 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 text-2xl shrink-0">
              🦪
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-md">
                  VÍ DỤ TRỰC QUAN KHO SAU CHẾ BIẾN
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Mã món: <code className="font-mono font-bold text-slate-800">{hauNuongDish.dishCode}</code>
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                {hauNuongDish.dishName} ({hauNuongDish.branchCode === 'QV' ? 'Chi nhánh Quế Võ' : 'Chi nhánh Thái Nguyên'})
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Chế biến từ: <strong className="text-slate-800">{hauNuongDish.rawItemName || 'Hàu tươi sống (QVHAU)'}</strong> tại Kho Trước Chế Biến • Khối lượng chuẩn: <strong>{hauNuongDish.standardPortionWeight || 0.4} kg/đĩa</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-emerald-200 shadow-sm self-stretch md:self-auto justify-between md:justify-end">
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Tồn Đĩa Khả Dụng</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                {hauNuongDish.quantity}{' '}
                <span className="text-base font-bold text-slate-600">{hauNuongDish.unit}</span>
              </span>
            </div>
            <div className="h-10 w-px bg-slate-200"></div>
            <div className="text-left">
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                SẴN SÀNG RA LINE
              </span>
              <span className="block text-[10px] text-slate-500 mt-1">
                Lần làm mẻ: {hauNuongDish.lastUpdatedAt || '11:20 Hôm nay'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. BỐN THẺ KPI TỔNG HỢP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Tổng Món Hoàn Chỉnh</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.totalDishes} món</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <PackageCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Tổng Đĩa Sẵn Sàng</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600">{stats.totalPlates} đĩa</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Món Đủ Tồn (≥5 đĩa)</span>
            <span className="text-xl sm:text-2xl font-black text-teal-700">{stats.readyDishes} món</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Món Hết/Sắp Hết (&lt;5 đĩa)</span>
            <span className="text-xl sm:text-2xl font-black text-rose-600">{stats.lowOrOutDishes} món</span>
          </div>
        </div>
      </div>

      {/* 4. THANH BỘ LỌC & TÌM KIẾM MÓN ĂN */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm món ăn thành phẩm (Hàu nướng, Cua sốt me, Bò tiêu đen, Ghẹ hấp...)"
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 focus:bg-white transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Lọc chi nhánh */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto shrink-0 text-xs font-bold">
            <span className="text-slate-500 px-2 flex items-center gap-1 text-[11px]">
              <Building2 className="h-3.5 w-3.5" /> Chi nhánh:
            </span>
            <button
              onClick={() => setSelectedBranchFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedBranchFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setSelectedBranchFilter('QV')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedBranchFilter === 'QV'
                  ? 'bg-amber-400 text-slate-950 shadow-sm font-black ring-1 ring-amber-500'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quế Võ (QV)
            </button>
            <button
              onClick={() => setSelectedBranchFilter('TN')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedBranchFilter === 'TN'
                  ? 'bg-indigo-600 text-white shadow-sm font-black ring-1 ring-indigo-400'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thái Nguyên (TN)
            </button>
          </div>
        </div>

        {/* Lọc danh mục món ăn */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap mr-1 flex items-center gap-1">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Phân loại:
          </span>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* 5. BẢNG DỮ LIỆU MÓN ĂN TRONG KHO SAU CHẾ BIẾN */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-amber-500" />
              <span>Danh Sách Món Ăn Trong Kho Sau Chế Biến ({filteredDishes.length} món)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi chính xác số lượng tồn đĩa khả dụng của từng món ăn trước khi ra line buffet.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Tồn an toàn (≥5 đĩa)
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Hết / Sắp hết (&lt;5 đĩa)
            </span>
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Mã Món</th>
                <th className="py-3.5 px-4">Tên Món Ăn Hoàn Chỉnh</th>
                <th className="py-3.5 px-4">Phân Loại</th>
                <th className="py-3.5 px-4">Chi Nhánh</th>
                <th className="py-3.5 px-4">Nguyên Liệu Thô (Kho Trước CB)</th>
                <th className="py-3.5 px-4 text-center">Khối Lượng Chuẩn</th>
                <th className="py-3.5 px-4 text-right">Tồn Khả Dụng</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái Ra Line</th>
                <th className="py-3.5 px-4 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDishes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <UtensilsCrossed className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">Không tìm thấy món ăn phù hợp với bộ lọc</p>
                    <p className="text-xs mt-1">Hãy thử tìm từ khóa khác hoặc chuyển sang "Tất cả chi nhánh"</p>
                  </td>
                </tr>
              ) : (
                filteredDishes.map((dish) => {
                  const isSafe = (dish.quantity || 0) >= 5;
                  const isOut = (dish.quantity || 0) === 0;

                  return (
                    <tr
                      key={dish.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        dish.dishName.toLowerCase().includes('hàu') ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Mã món */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        <code>{dish.dishCode}</code>
                      </td>

                      {/* Tên món */}
                      <td className="py-3 px-4">
                        <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                          <span>{dish.dishName}</span>
                          {dish.dishName.toLowerCase().includes('hàu') && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-400 text-slate-950 font-black">
                              TRỌNG ĐIỂM
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Mẻ gần nhất: {dish.lastUpdatedAt || '11:20 Hôm nay'}
                        </span>
                      </td>

                      {/* Phân loại */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                            dish.category.includes('Nướng')
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : dish.category.includes('Hấp')
                              ? 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                              : dish.category.includes('Nóng')
                              ? 'bg-rose-100 text-rose-900 border border-rose-200'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {dish.category}
                        </span>
                      </td>

                      {/* Chi nhánh */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black ${
                            dish.branchCode === 'QV' || dish.branchId === 2
                              ? 'bg-amber-400/20 text-amber-900 border border-amber-300'
                              : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                          }`}
                        >
                          {dish.branchCode === 'QV' || dish.branchId === 2
                            ? 'Quế Võ (QV)'
                            : 'Thái Nguyên (TN)'}
                        </span>
                      </td>

                      {/* Nguyên liệu thô */}
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {dish.rawItemName ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            <span>{dish.rawItemName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Nguyên liệu hải sản</span>
                        )}
                      </td>

                      {/* Khối lượng chuẩn */}
                      <td className="py-3 px-4 text-center font-semibold text-slate-700">
                        {dish.standardPortionWeight || 0.4} kg / đĩa
                      </td>

                      {/* Tồn khả dụng (To, nổi bật) */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`text-base sm:text-lg font-black tracking-tight ${
                            isOut
                              ? 'text-rose-600'
                              : isSafe
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {dish.quantity}{' '}
                          <span className="text-xs font-bold text-slate-500">{dish.unit}</span>
                        </span>
                      </td>

                      {/* Trạng thái ra line */}
                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                            <AlertTriangle className="h-3 w-3" />
                            HẾT HÀNG (CẦN NÚT 2)
                          </span>
                        ) : isSafe ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            SẴN SÀNG RA LINE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="h-3 w-3" />
                            SẮP HẾT ({dish.quantity} đĩa)
                          </span>
                        )}
                      </td>

                      {/* Hành động */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenAdjust(dish)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center gap-1 transition-all active:scale-95"
                          title="Điều chỉnh số đĩa thực tế"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                          <span>Điều chỉnh</span>
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

      {/* 6. MODAL ĐIỀU CHỈNH TỒN ĐĨA THỰC TẾ (KIỂM KÊ / ĐIỀU CHỈNH KHO SAU CHẾ BIẾN) */}
      {editingDish && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-black">Điều Chỉnh Tồn Kho Sau Chế Biến</h4>
                  <p className="text-xs text-slate-400">Cập nhật số đĩa thực tế trong bếp</p>
                </div>
              </div>
              <button
                onClick={() => setEditingDish(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 block">Món ăn thành phẩm:</span>
                <span className="text-base font-black text-slate-900 block mt-0.5">
                  {editingDish.dishName}
                </span>
                <span className="text-xs text-slate-600 block mt-1">
                  Mã món: <code className="font-mono font-bold">{editingDish.dishCode}</code> • Chi nhánh:{' '}
                  <strong>{editingDish.branchCode === 'QV' ? 'Quế Võ' : 'Thái Nguyên'}</strong>
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Số lượng tồn thực tế ({editingDish.unit}):
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustQuantity((prev) => Math.max(0, prev - 1))}
                    className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-lg flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(Number(e.target.value) || 0)}
                    className="flex-1 text-center font-black text-xl py-2 px-3 rounded-xl border-2 border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustQuantity((prev) => prev + 1)}
                    className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-lg flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Lý do điều chỉnh (Kiểm soát gian lận & Audit trail):
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full text-xs font-medium py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Kiểm kê đĩa thực tế đầu ca">Kiểm kê đĩa thực tế đầu ca</option>
                  <option value="Bếp hoàn tất mẻ nấu bổ sung">Bếp hoàn tất mẻ nấu bổ sung</option>
                  <option value="Hủy đĩa hỏng hoặc nguội cuối ca">Hủy đĩa hỏng hoặc nguội cuối ca</option>
                  <option value="Điều chỉnh sai lệch kiểm kê">Điều chỉnh sai lệch kiểm kê</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingDish(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmAdjust}
                disabled={isSubmittingAdjust}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/30 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Xác nhận cập nhật</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
