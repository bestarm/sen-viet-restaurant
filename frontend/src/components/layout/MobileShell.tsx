import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import {
  Flame,
  Clock,
  Award,
  UserCheck,
  LayoutDashboard,
  Boxes,
  FileSpreadsheet,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userHasRole } from '../../utils/rbac';

interface MobileShellProps {
  children: ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

interface NavTabItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

export const MobileShell: React.FC<MobileShellProps> = ({
  children,
  activeTab = 'kitchen',
  onTabChange,
}) => {
  const { user } = useAuth();

  // Xác định danh sách các tab điều hướng di động theo thẩm quyền RBAC
  const getNavTabs = (): NavTabItem[] => {
    if (!user) {
      return [
        { id: 'attendance', label: 'Chấm công', icon: Clock },
        { id: 'exam', label: 'Thi nghề', icon: Award },
        { id: 'profile', label: 'Cá nhân', icon: UserCheck },
      ];
    }

    const isGenAcc =
      user.username === 'ketoan_tong' ||
      userHasRole(user, 'ROLE_GENERAL_ACCOUNTANT') ||
      userHasRole(user, 'ROLE_KETOAN_TONG') ||
      userHasRole(user, 'ROLE_ACCOUNTANT');
    const isMgr = userHasRole(user, 'ROLE_RESTAURANT_MANAGER');
    const isBrAcc =
      userHasRole(user, 'ROLE_BRANCH_ACCOUNTANT') ||
      userHasRole(user, 'ROLE_KETOAN_CHINHANH') ||
      user.username === 'ketoan_tn' ||
      user.username === 'ketoan_qv';
    const isKitchen = userHasRole(user, 'ROLE_KITCHEN_STAFF');

    // 1. Kế toán tổng chuỗi
    if (isGenAcc) {
      return [
        { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { id: 'kitchen', label: 'Bếp 4 Nút', icon: Flame },
        { id: 'warehouse', label: 'Kho', icon: Boxes },
        { id: 'reconciliation', label: 'Đối soát', icon: FileSpreadsheet },
        { id: 'payroll', label: 'Lương', icon: Wallet },
      ];
    }

    // 2. Quản lý Nhà hàng
    if (isMgr) {
      return [
        { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { id: 'kitchen', label: 'Bếp & Mẻ', icon: Flame },
        { id: 'reconciliation', label: 'Đối soát', icon: FileSpreadsheet },
        { id: 'attendance', label: 'Nhân sự', icon: Clock },
        { id: 'profile', label: 'Cá nhân', icon: UserCheck },
      ];
    }

    // 3. Kế toán Chi nhánh
    if (isBrAcc) {
      return [
        { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { id: 'warehouse', label: 'Kho cơ sở', icon: Boxes },
        { id: 'reconciliation', label: 'Đối soát', icon: FileSpreadsheet },
        { id: 'payroll', label: 'Bảng lương', icon: Wallet },
        { id: 'profile', label: 'Cá nhân', icon: UserCheck },
      ];
    }

    // 4. Nhân viên Bếp / Bar
    if (isKitchen) {
      return [
        { id: 'kitchen', label: 'Bếp 4 Nút', icon: Flame },
        { id: 'attendance', label: 'Chấm công', icon: Clock },
        { id: 'exam', label: 'Thi nghề', icon: Award },
        { id: 'profile', label: 'Cá nhân', icon: UserCheck },
      ];
    }

    // 5. Nhân viên phục vụ / Thu ngân / Nhân sự chung (ROLE_EMPLOYEE thuần túy)
    // Tuyệt đối ẨN nút Bếp, Kho, Đối soát, Bảng lương chuỗi!
    return [
      { id: 'attendance', label: 'Chấm công', icon: Clock },
      { id: 'exam', label: 'Thi nghề', icon: Award },
      { id: 'profile', label: 'Cá nhân', icon: UserCheck },
    ];
  };

  const navTabs = getNavTabs();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 p-3 pb-24 max-w-md mx-auto w-full">
        {children}
      </main>

      {/* Bottom Sticky Navigation (Mobile-first, nút bấm to tối thiểu 48px) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around h-16 px-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              activeTab === tab.id ||
              (tab.id === 'attendance' && activeTab === 'hr-attendance');
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange && onTabChange(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors ${
                  isActive
                    ? 'text-brand-600 font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[11px] mt-1 truncate max-w-[72px] text-center">
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-4 h-0.5 bg-brand-600 rounded-full mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
