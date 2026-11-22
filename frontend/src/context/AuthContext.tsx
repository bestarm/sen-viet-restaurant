import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, RoleName, LoginRequest, AppContextType, AppContextOption } from '../types/auth';
import { loginApi, getMeApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  roles: string[];
  activeContext: AppContextType;
  setActiveContext: (context: AppContextType) => void;
  availableContexts: AppContextOption[];
  isMultiRole: boolean;
  isKitchen: boolean;
  isManager: boolean;
  isAccountant: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('senviet_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeContext, setActiveContextState] = useState<AppContextType>(() => {
    const saved = localStorage.getItem('senviet_active_context');
    return (saved as AppContextType) || 'KITCHEN';
  });

  // Khi tải ứng dụng, nếu có token thì nạp thông tin user
  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await getMeApi();
          setUser(profile);
        } catch (error) {
          console.error('Không thể xác thực token lưu trữ:', error);
          localStorage.removeItem('senviet_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const hasRole = (role: string): boolean => {
    if (!user || !user.roles) return false;
    const normalizedRole = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
    return user.roles.some((r) => r === role || r === normalizedRole);
  };

  const isKitchen = hasRole('ROLE_KITCHEN_STAFF');
  const isManager = hasRole('ROLE_RESTAURANT_MANAGER') || hasRole('ROLE_QL_CHINHANH');
  const isAccountant =
    user?.username === 'ketoan_tong' ||
    user?.username === 'ketoan_tn' ||
    hasRole('ROLE_KETOAN_CHINHANH') ||
    hasRole('ROLE_BRANCH_ACCOUNTANT') ||
    hasRole('ROLE_GENERAL_ACCOUNTANT') ||
    hasRole('ROLE_KETOAN_TONG') ||
    hasRole('ROLE_ACCOUNTANT');
  const isEmployee = hasRole('ROLE_EMPLOYEE') || (!isKitchen && !isManager && !isAccountant);

  // Tính danh sách các Không gian làm việc (Contexts) dựa trên vai trò của người dùng
  const availableContexts: AppContextOption[] = [];
  if (isKitchen) {
    availableContexts.push({
      id: 'KITCHEN',
      label: 'Khu Vực Bếp & Bar',
      badge: 'Bếp 4 Nút',
      description: '4 Nút lớn, Cân mẻ, Báo hỏng & Ra line',
      icon: 'Flame',
    });
  }
  // Nhân viên bếp, quản lý hoặc nhân viên đều có cổng nhân viên cá nhân (chấm công, thi nghề, ứng lương)
  if (isEmployee || isKitchen || isManager || isAccountant) {
    availableContexts.push({
      id: 'EMPLOYEE_PORTAL',
      label: 'Cổng Nhân Viên Cá Nhân',
      badge: 'Cá Nhân',
      description: 'Chấm công GPS, Thi đánh giá quý & Phiếu lương',
      icon: 'UserCheck',
    });
  }
  if (isManager || isAccountant) {
    availableContexts.push({
      id: 'MANAGEMENT',
      label: 'Bàn Quản Trị Hệ Thống',
      badge: 'Quản Lý',
      description: 'Kho cơ sở, Đối soát CukCuk POS & Quản trị nhân sự',
      icon: 'LayoutDashboard',
    });
  }

  const isMultiRole = availableContexts.length > 1;

  // Tự động điều chỉnh activeContext hợp lệ nếu context hiện tại không nằm trong danh sách quyền
  useEffect(() => {
    if (user && availableContexts.length > 0) {
      const isCurrentContextValid = availableContexts.some((c) => c.id === activeContext);
      if (!isCurrentContextValid) {
        const defaultCtx = isKitchen
          ? 'KITCHEN'
          : isManager || isAccountant
          ? 'MANAGEMENT'
          : 'EMPLOYEE_PORTAL';
        setActiveContextState(defaultCtx);
        localStorage.setItem('senviet_active_context', defaultCtx);
      }
    }
  }, [user, activeContext, availableContexts.length]);

  const setActiveContext = (ctx: AppContextType) => {
    setActiveContextState(ctx);
    localStorage.setItem('senviet_active_context', ctx);
  };

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const data = await loginApi(credentials);
      localStorage.setItem('senviet_token', data.accessToken);
      setToken(data.accessToken);

      // Nạp thông tin user profile đầy đủ
      const profile = await getMeApi();
      setUser(profile);

      // Thiết lập ngữ cảnh mặc định theo vai trò ưu tiên
      const roles = profile.roles || [];
      const hasKitchen = roles.includes('ROLE_KITCHEN_STAFF');
      const hasManager =
        roles.includes('ROLE_RESTAURANT_MANAGER') ||
        roles.includes('ROLE_BRANCH_ACCOUNTANT') ||
        roles.includes('ROLE_GENERAL_ACCOUNTANT') ||
        roles.includes('ROLE_KETOAN_TONG') ||
        roles.includes('ROLE_ACCOUNTANT') ||
        profile.username === 'ketoan_tong';
      const defaultCtx: AppContextType = hasKitchen ? 'KITCHEN' : hasManager ? 'MANAGEMENT' : 'EMPLOYEE_PORTAL';
      setActiveContext(defaultCtx);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('senviet_token');
    localStorage.removeItem('senviet_active_context');
    setToken(null);
    setUser(null);
  };

  const roles = user?.roles ? (user.roles as string[]) : [];

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        hasRole,
        roles,
        activeContext,
        setActiveContext,
        availableContexts,
        isMultiRole,
        isKitchen,
        isManager,
        isAccountant,
        isEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};
