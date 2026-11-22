export type RoleName =
  | 'ROLE_KITCHEN_STAFF'
  | 'ROLE_RESTAURANT_MANAGER'
  | 'ROLE_BRANCH_ACCOUNTANT'
  | 'ROLE_GENERAL_ACCOUNTANT'
  | 'ROLE_EMPLOYEE'
  | 'ROLE_KETOAN_CHINHANH'
  | 'ROLE_KETOAN_TONG'
  | 'ROLE_CHU_CHUOI'
  | 'ROLE_BEP'
  | 'ROLE_QL_BEP'
  | 'ROLE_QL_CHINHANH'
  | string;

export type AppContextType = 'KITCHEN' | 'EMPLOYEE_PORTAL' | 'MANAGEMENT';

export interface AppContextOption {
  id: AppContextType;
  label: string;
  badge: string;
  description: string;
  icon: string;
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  branchId?: number | null;
  branchName?: string | null;
  branchCode?: string | null;
  roles: RoleName[];
  status: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface JwtAuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  username: string;
  fullName: string;
  branchId?: number | null;
  branchName?: string | null;
  roles: RoleName[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export * from './warehouse';
