import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut,
  MapPin,
  ShieldCheck,
  Utensils,
  Flame,
  UserCheck,
  LayoutDashboard,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, activeContext, setActiveContext, availableContexts, isMultiRole } = useAuth();

  if (!user) return null;

  const getRoleDisplayName = (roles: string[]) => {
    const names: string[] = [];
    if (roles.includes('ROLE_KITCHEN_STAFF')) names.push('Bếp / Bar');
    if (roles.includes('ROLE_RESTAURANT_MANAGER')) names.push('Quản lý');
    if (roles.includes('ROLE_BRANCH_ACCOUNTANT')) names.push('Kế toán CN');
    if (
      roles.includes('ROLE_GENERAL_ACCOUNTANT') ||
      roles.includes('ROLE_KETOAN_TONG') ||
      roles.includes('ROLE_ACCOUNTANT') ||
      user.username === 'ketoan_tong'
    ) {
      names.push('Kế toán Tổng');
    }
    if (roles.includes('ROLE_EMPLOYEE')) names.push('Nhân viên');
    return names.length > 0 ? names.join(' + ') : 'Người dùng';
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Utensils className="h-6 w-6" />
          </div>
          <div>
            <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight block">
              Sen Việt Buffet
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 font-medium">
              <MapPin className="h-3 w-3 text-brand-600" />
              {user.branchName || 'Toàn hệ thống'}
            </span>
          </div>
        </div>

        {/* GIAI ĐOẠN 9: MULTI-ROLE CONTEXT SWITCHER */}
        {isMultiRole && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            {availableContexts.map((ctx) => {
              const isSelected = activeContext === ctx.id;
              return (
                <button
                  key={ctx.id}
                  onClick={() => setActiveContext(ctx.id)}
                  title={ctx.description}
                  className={`btn-touch px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-black'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {ctx.id === 'KITCHEN' && (
                    <Flame className={`h-4 w-4 ${isSelected ? 'text-amber-500' : 'text-slate-400'}`} />
                  )}
                  {ctx.id === 'EMPLOYEE_PORTAL' && (
                    <UserCheck className={`h-4 w-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                  )}
                  {ctx.id === 'MANAGEMENT' && (
                    <LayoutDashboard className={`h-4 w-4 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                  )}
                  <span className="hidden md:inline">{ctx.label}</span>
                  <span className="inline md:hidden">{ctx.badge}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* User Info & Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-800 leading-tight">
              {user.fullName}
            </span>
            <span className="text-[11px] font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5 self-end">
              <ShieldCheck className="h-3 w-3" />
              {getRoleDisplayName(user.roles)}
            </span>
          </div>

          <button
            onClick={logout}
            title="Đăng xuất khỏi hệ thống"
            className="btn-touch p-2 sm:px-3 sm:py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium border border-transparent hover:border-red-100"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
};
