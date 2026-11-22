import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { resetToSeedData } from '../../db/dbService';
import { db } from '../../db/schema';
import {
  RotateCcw,
  Sparkles,
  Users,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  ChefHat,
  Briefcase,
  Calculator,
  Receipt,
  Crown,
  Minimize2,
  Maximize2,
} from 'lucide-react';

interface RoleOption {
  username: string;
  label: string;
  roleBadge: string;
  icon: React.ReactNode;
  color: string;
}

const DEMO_ROLES: RoleOption[] = [
  {
    username: 'bep_tn',
    label: 'Nguyễn Văn Bếp',
    roleBadge: 'Bếp / Bar',
    icon: <Flame className="w-4 h-4 text-orange-500" />,
    color: 'hover:bg-orange-50 text-orange-700',
  },
  {
    username: 'ql_bep_tn',
    label: 'Trần Thị Bếp Trưởng',
    roleBadge: 'Quản lý Bếp',
    icon: <ChefHat className="w-4 h-4 text-amber-500" />,
    color: 'hover:bg-amber-50 text-amber-700',
  },
  {
    username: 'ql_chinhanh_tn',
    label: 'Lê Hoàng Quản Lý',
    roleBadge: 'QL Chi nhánh',
    icon: <Briefcase className="w-4 h-4 text-blue-500" />,
    color: 'hover:bg-blue-50 text-blue-700',
  },
  {
    username: 'ketoan_tn',
    label: 'Nguyễn Thu Thủy',
    roleBadge: 'KT Chi nhánh',
    icon: <Receipt className="w-4 h-4 text-teal-600" />,
    color: 'hover:bg-teal-50 text-teal-700',
  },
  {
    username: 'ketoan_tong',
    label: 'Phạm Thu Kế Toán',
    roleBadge: 'Kế toán Tổng',
    icon: <Calculator className="w-4 h-4 text-emerald-500" />,
    color: 'hover:bg-emerald-50 text-emerald-700',
  },
  {
    username: 'admin_chu',
    label: 'Đặng Tổng Giám Đốc',
    roleBadge: 'Chủ chuỗi / Admin',
    icon: <Crown className="w-4 h-4 text-purple-500" />,
    color: 'hover:bg-purple-50 text-purple-700',
  },
];

/**
 * DemoToolbar (Thanh công cụ Demo tương tác độc lập).
 * Thiết kế Floating Pill / Sticky tinh tế, hỗ trợ THU GỌN (Minimize)
 * để TUYỆT ĐỐI KHÔNG che khuất navbar hoặc nội dung làm việc trên di động.
 */
export const DemoToolbar: React.FC = () => {
  const { user, login } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('senviet_demo_toolbar_collapsed') === 'true';
  });
  const [isResetting, setIsResetting] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);

  // Lưu trạng thái thu gọn vào storage
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('senviet_demo_toolbar_collapsed', String(next));
      return next;
    });
    setIsRoleOpen(false);
    setIsBranchOpen(false);
  };

  // Switch Role
  const handleSelectRole = async (username: string) => {
    setIsRoleOpen(false);
    try {
      await login({ username, password: 'any' });
      showSuccess(`Đã chuyển sang vai trò: ${username}`, 'CHUYỂN VAI TRÒ THÀNH CÔNG');
    } catch (err: any) {
      showError(err.message || 'Lỗi chuyển vai trò', 'LỖI');
    }
  };

  // Switch Branch
  const handleSelectBranch = async (branchId: number, branchName: string, branchCode: string) => {
    setIsBranchOpen(false);
    if (!user) return;
    try {
      await db.users.update(user.id, { branchId, branchName, branchCode });
      await login({ username: user.username, password: 'any' });
      showSuccess(`Đã chuyển làm việc tại: ${branchName}`, 'ĐỔI CHI NHÁNH THÀNH CÔNG');
    } catch (err: any) {
      showError(err.message || 'Lỗi đổi chi nhánh', 'LỖI');
    }
  };

  // Reset 1-Click Database
  const handleResetData = async () => {
    if (!window.confirm('Khôi phục toàn bộ cơ sở dữ liệu IndexedDB về dữ liệu mẫu ban đầu?')) {
      return;
    }
    try {
      setIsResetting(true);
      await resetToSeedData();
      const currentUsername = user?.username || 'bep_tn';
      await login({ username: currentUsername, password: 'any' });
      showSuccess(
        'Đã khôi phục 100% dữ liệu mẫu ban đầu (Mẻ nấu, Báo hỏng, Đối soát CukCuk, Chấm công, Bảng lương)',
        'RESET DỮ LIỆU THÀNH CÔNG'
      );
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err: any) {
      showError('Lỗi khi khôi phục dữ liệu mẫu: ' + err.message, 'LỖI RESET');
    } finally {
      setIsResetting(false);
    }
  };

  const currentRoleOption = DEMO_ROLES.find((r) => r.username === user?.username) || DEMO_ROLES[0];
  const isThaiNguyen = !user?.branchId || user.branchId === 1;

  // Khi đang thu gọn (Collapsed Mode): hiển thị floating pill siêu gọn ở góc trên phải
  if (isCollapsed) {
    return (
      <aside aria-label="Demo Toolbar Mini" className="fixed top-2.5 right-2.5 z-50 animate-fade-in">
        <button
          onClick={toggleCollapse}
          title="Mở rộng thanh công cụ Demo điều khiển vai trò & dữ liệu"
          className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md text-white border border-slate-700/80 hover:border-amber-500/80 px-3 py-1.5 rounded-full shadow-floating hover:bg-slate-800 transition-all active:scale-95 text-xs font-semibold group"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="text-amber-300 font-bold hidden sm:inline">DEMO:</span>
          <span className="text-slate-200">{currentRoleOption.roleBadge}</span>
          <span className="text-slate-400 text-[10px]">({isThaiNguyen ? 'TN' : 'QV'})</span>
          <Maximize2 className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors ml-0.5" />
        </button>
      </aside>
    );
  }

  // Khi đang mở rộng (Expanded Mode): Sticky Bar tinh tế có bóng đổ nhẹ và nút thu gọn
  return (
    <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white text-xs py-1.5 px-3 sm:px-6 sticky top-0 z-40 shadow-soft transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Logo / Badge Standalone Demo */}
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-1.5 font-bold tracking-wide text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">DEMO ĐỘC LẬP (IndexedDB)</span>
            <span className="sm:hidden font-mono text-[11px] text-amber-300">DEMO</span>
          </div>
        </div>

        {/* Controls: Quick Role Switcher + Branch Switcher + 1-Click Reset + Thu gọn */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          {/* 1. Quick Role Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setIsRoleOpen(!isRoleOpen);
                setIsBranchOpen(false);
              }}
              className="bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/90 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              title="Đổi vai trò người dùng trải nghiệm"
            >
              <Users className="w-3.5 h-3.5 text-brand-400" />
              <span className="font-semibold text-brand-300">
                {currentRoleOption.roleBadge}
              </span>
              <span className="hidden md:inline text-slate-300">
                ({currentRoleOption.label.split(' ').slice(-1)[0]})
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isRoleOpen ? 'rotate-180' : ''}`} />
            </button>

            {isRoleOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white text-slate-800 rounded-2xl shadow-floating border border-slate-200 py-1.5 z-50 animate-fade-in overflow-hidden">
                <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                  Chọn 1 trong 5 vai trò:
                </div>
                {DEMO_ROLES.map((r) => {
                  const isSelected = r.username === user?.username;
                  return (
                    <button
                      key={r.username}
                      onClick={() => handleSelectRole(r.username)}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between text-xs transition-colors ${
                        isSelected ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {r.icon}
                        <div>
                          <div className="font-semibold">{r.label}</div>
                          <div className="text-[10px] text-slate-500">{r.roleBadge}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-brand-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Branch Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setIsBranchOpen(!isBranchOpen);
                setIsRoleOpen(false);
              }}
              className="bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/90 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              title="Đổi chi nhánh làm việc"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{isThaiNguyen ? 'CN Thái Nguyên' : 'CN Quế Võ'}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isBranchOpen ? 'rotate-180' : ''}`} />
            </button>

            {isBranchOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white text-slate-800 rounded-2xl shadow-floating border border-slate-200 py-1.5 z-50 animate-fade-in overflow-hidden">
                <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                  Chọn Chi nhánh làm việc:
                </div>
                <button
                  onClick={() =>
                    handleSelectBranch(1, 'Sen Việt Buffet - Chi nhánh Thái Nguyên', 'TN')
                  }
                  className={`w-full text-left px-3.5 py-2 flex items-center justify-between text-xs transition-colors ${
                    isThaiNguyen ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold">Chi nhánh Thái Nguyên</div>
                    <div className="text-[10px] text-slate-500">188 Lương Ngọc Quyến</div>
                  </div>
                  {isThaiNguyen && <Check className="w-4 h-4 text-brand-600" />}
                </button>
                <button
                  onClick={() =>
                    handleSelectBranch(2, 'Sen Việt Buffet - Chi nhánh Quế Võ', 'QV')
                  }
                  className={`w-full text-left px-3.5 py-2 flex items-center justify-between text-xs transition-colors ${
                    !isThaiNguyen ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold">Chi nhánh Quế Võ</div>
                    <div className="text-[10px] text-slate-500">TX. Quế Võ, Bắc Ninh</div>
                  </div>
                  {!isThaiNguyen && <Check className="w-4 h-4 text-brand-600" />}
                </button>
              </div>
            )}
          </div>

          {/* 3. 1-Click "Reset Dữ Liệu Mẫu" */}
          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-800 text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Khôi phục toàn bộ dữ liệu mẫu trong IndexedDB"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isResetting ? 'Đang reset...' : '🔄 Reset Dữ Liệu'}</span>
            <span className="sm:hidden">{isResetting ? '...' : 'Reset'}</span>
          </button>

          {/* 4. Nút Thu Gọn (Minimize) để KHÔNG che màn hình */}
          <button
            onClick={toggleCollapse}
            title="Thu gọn thanh công cụ Demo vào góc màn hình"
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors ml-1"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoToolbar;
