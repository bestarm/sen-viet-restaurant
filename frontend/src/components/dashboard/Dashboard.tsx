import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { isViewAuthorized, getRoleDisplayBadges } from '../../utils/rbac';
import {
  Flame,
  FileSpreadsheet,
  Users,
  Wallet,
  ShieldCheck,
  Boxes,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
} from 'lucide-react';

interface DashboardProps {
  onNavigateToKitchen?: () => void;
  onNavigateToWarehouse?: () => void;
  onNavigateToReconciliation?: () => void;
  onNavigateToHR?: () => void;
  onNavigateToPayroll?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateToKitchen,
  onNavigateToWarehouse,
  onNavigateToReconciliation,
  onNavigateToHR,
  onNavigateToPayroll,
}) => {
  const { user } = useAuth();

  if (!user) return null;

  const roleBadges = getRoleDisplayBadges(user.roles);
  const canSeeKitchen = isViewAuthorized('kitchen', user);
  const canSeeWarehouse = isViewAuthorized('warehouse', user);
  const canSeeReconciliation = isViewAuthorized('reconciliation', user);
  const canSeeHR = isViewAuthorized('hr-attendance', user);
  const canSeePayroll = isViewAuthorized('payroll', user);

  // Lấy ngày hiện tại định dạng Việt Nam
  const todayFormatted = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="space-y-4 xl:space-y-3.5 animate-in fade-in duration-300">
      {/* 1. Header Banner Vận Hành */}
      <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 rounded-2xl p-5 sm:p-6 text-white shadow-xl shadow-brand-900/20 relative overflow-hidden">
        {/* Subtle decorative background blur */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-40 top-0 w-32 h-32 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Bảng Điều Khiển Vận Hành Nhà Hàng</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Xin chào, {user.fullName}!
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-white/90 pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="h-4 w-4 text-amber-300 shrink-0" />
                {user.branchName || 'Toàn Chuỗi Sen Việt'} ({user.branchCode || 'CENTRAL'})
              </span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="h-4 w-4 text-emerald-300 shrink-0" />
                {todayFormatted} (Ca Trưa 10:00 - 14:30)
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {roleBadges.map((badge, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-lg bg-black/25 text-amber-200 border border-white/15 text-xs font-bold"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="flex md:flex-col items-start md:items-end justify-between border-t md:border-t-0 border-white/20 pt-4 md:pt-0">
            <span className="text-xs text-white/70">Trạng Thái Hệ Thống</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-sm text-emerald-200">Đang Vận Hành Ca</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Authentic Restaurant Operations KPIs (Thay thế toàn bộ dev milestone cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-600" />
            <span>Chỉ Số Vận Hành Trọng Yếu (Ca & Ngày)</span>
          </h2>
          <span className="text-xs font-medium text-slate-500">
            Cập nhật theo thời gian thực
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Doanh thu ca / ngày */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Doanh Thu Ngày</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              48.500.000 <span className="text-sm font-semibold text-slate-600">đ</span>
            </div>
            <div className="mt-2 text-xs text-slate-600 space-y-0.5">
              <p>Ca trưa: <span className="font-semibold text-slate-800">28.200.000 đ</span></p>
              <p className="text-emerald-700 font-bold flex items-center gap-1">
                <span>↑ +8.4%</span>
                <span className="text-slate-500 font-normal">so với hôm qua</span>
              </p>
            </div>
          </div>

          {/* KPI 2: Số khách phục vụ */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Số Khách Phục Vụ</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              186 <span className="text-sm font-semibold text-slate-600">khách</span>
            </div>
            <div className="mt-2 text-xs text-slate-600 space-y-0.5">
              <p>Vé 299k: <span className="font-semibold text-slate-800">142 suất</span> | Vé 369k: <span className="font-semibold text-slate-800">44 suất</span></p>
              <p className="text-indigo-700 font-bold">100% bàn đã gọi món buffet</p>
            </div>
          </div>

          {/* KPI 3: Mẻ Bếp & Ra Line */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Bếp 4 Nút & Ra Line</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Flame className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              3 <span className="text-sm font-semibold text-slate-600">mẻ đang nấu</span>
            </div>
            <div className="mt-2 text-xs text-slate-600 space-y-0.5">
              <p>Đã ra line: <span className="font-semibold text-slate-800">42 đĩa/khay</span> trong ca</p>
              <p className="text-amber-800 font-bold">Cua Cà Mau (15.5 kg), Ghẹ, Tôm</p>
            </div>
          </div>

          {/* KPI 4: Trạng Thái Tồn Kho & Lô Hàng */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Kho & Lô Hàng</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Boxes className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              8 <span className="text-sm font-semibold text-slate-600">lô hàng</span>
            </div>
            <div className="mt-2 text-xs text-slate-600 space-y-0.5">
              <p>7 lô an toàn | <span className="font-bold text-rose-700">1 lô sắp hết</span></p>
              <p className="text-blue-700 font-bold">Kiểm kê ca sáng: Đã chốt số liệu</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Cảnh Báo Chống Thất Thoát Nổi Bật (Red Loss Banner) */}
      <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-rose-700 border-2 border-rose-800 rounded-3xl p-6 text-white shadow-xl shadow-rose-900/25 ring-4 ring-rose-200/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 text-rose-100 text-xs font-black uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4 text-amber-300 animate-pulse" />
              <span>Cảnh Báo Thất Thoát Trọng Điểm Cuối Ngày</span>
            </div>

            <h3 className="text-lg sm:text-xl font-black leading-snug">
              Phát hiện 2 mặt hàng lệch kho vượt ngưỡng an toàn (&gt; 5% hoặc &gt; 300.000 đ)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                <span className="text-xs font-bold text-amber-200 block">
                  🔴 Cua Cà Mau Sống (LOT-202611-001)
                </span>
                <span className="text-sm font-black text-white">
                  Lệch thất thoát: -6.5 kg (-2.275.000 đ)
                </span>
                <span className="text-[11px] text-white/80 block mt-0.5">
                  Tỷ lệ lệch 6.84% • Kế toán & Quản lý cần đối chất giải trình
                </span>
              </div>

              <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                <span className="text-xs font-bold text-amber-200 block">
                  🔴 Ghẹ Phú Quốc Tươi (LOT-202611-002)
                </span>
                <span className="text-sm font-black text-white">
                  Lệch thất thoát: -4.2 kg (-1.176.000 đ)
                </span>
                <span className="text-[11px] text-white/80 block mt-0.5">
                  Tỷ lệ lệch 5.60% • Tự động gửi cảnh báo nhóm Zalo Ban Giám Đốc
                </span>
              </div>
            </div>
          </div>

          {canSeeReconciliation && onNavigateToReconciliation && (
            <div className="lg:self-center shrink-0">
              <button
                type="button"
                onClick={onNavigateToReconciliation}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-rose-700 font-black text-sm hover:bg-rose-50 transition-all shadow-lg flex items-center justify-center gap-2 group active:scale-95"
              >
                <span>Xem Bảng Đối Soát Chi Tiết</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Quick Navigation Modules (Chỉ hiển thị các phân hệ người dùng có thẩm quyền) */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand-600" />
          <span>Lối Tắt Phân Hệ Quản Trị Hợp Quyền</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {/* Card Bếp 4 Nút */}
          {canSeeKitchen && onNavigateToKitchen && (
            <div
              onClick={onNavigateToKitchen}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-amber-500 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                    <Flame className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded-full">
                    3 mẻ đang chạy
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition-colors">
                  Bếp 4 Nút & Cân Mẻ
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Cân mẻ đầu vào, thành phẩm, cảnh báo mẻ 2, ra line (+1) và nén ảnh báo hỏng tức thời.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
                <span>Vào phân hệ Bếp</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

          {/* Card Kho Cơ Sở */}
          {canSeeWarehouse && onNavigateToWarehouse && (
            <div
              onClick={onNavigateToWarehouse}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                    <Boxes className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-full">
                    8 Lô hàng
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                  Kho Cơ Sở & Lô Hàng (Lots)
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Nhập xuất kho đa ca, theo dõi mã lô LOT, quản lý Nhà cung cấp và kiểm kê ca bắt buộc giải trình.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
                <span>Vào phân hệ Kho</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

          {/* Card Đối Soát CukCuk */}
          {canSeeReconciliation && onNavigateToReconciliation && (
            <div
              onClick={onNavigateToReconciliation}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-rose-500 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-rose-700 bg-rose-100/70 px-2.5 py-1 rounded-full">
                    2 cảnh báo đỏ
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base group-hover:text-rose-600 transition-colors">
                  Đối Soát Cuối Ngày (CukCuk)
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Đọc Excel POS CukCuk, tự động cân đối tồn xuất dùng và tô đỏ rực rỡ thất thoát &gt; 300.000 đ.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-700">
                <span>Vào phân hệ Đối soát</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

          {/* Card Nhân Sự & Chấm Công GPS */}
          {canSeeHR && onNavigateToHR && (
            <div
              onClick={onNavigateToHR}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-500 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-full">
                    GPS Geofencing
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                  Nhân Sự & Chấm Công GPS
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Chấm công GPS &lt; 50m kèm selfie, thi trắc nghiệm quý, xử lý bỏ việc và thu hồi đồng phục.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-700">
                <span>Vào phân hệ Nhân sự</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

          {/* Card Bảng Lương & Ứng Lương */}
          {canSeePayroll && onNavigateToPayroll && (
            <div
              onClick={onNavigateToPayroll}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full">
                    Duyệt chi ứng lương
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition-colors">
                  Bảng Lương & Ứng Lương
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Duyệt ứng lương thực chi, khóa kỳ lương kiểm toán, giữ lương thiếu đồng phục và xuất Excel ngân hàng.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>Vào phân hệ Bảng lương</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
