import { User, RoleName } from '../types/auth';

export type ViewId =
  | 'dashboard'
  | 'executive-cockpit'
  | 'head-chef'
  | 'branch-manager'
  | 'kitchen'
  | 'warehouse'
  | 'reconciliation'
  | 'kitchen-monitor'
  | 'hr-attendance'
  | 'payroll'
  | 'attendance'
  | 'exam'
  | 'profile';

/**
 * Kiểm tra người dùng có một vai trò cụ thể hay không (chuẩn hóa tiền tố ROLE_)
 */
export function userHasRole(user: User | null | undefined, role: string): boolean {
  if (!user || !user.roles || !Array.isArray(user.roles)) return false;
  const normalized = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
  return user.roles.some((r) => r === role || r === normalized);
}

/**
 * Kiểm tra xem một phân hệ / màn hình (View) có được phép hiển thị cho người dùng hay không.
 * Tuân thủ nghiêm ngặt ma trận phân quyền nâng cấp Sprint 3:
 * - ROLE_CHU_CHUOI (admin_chu): Toàn quyền xem Executive Cockpit (Bảng chỉ huy 10s), Đối soát chuỗi, Bảng đen NCC, Duyệt tăng lương, cùng các phân hệ khác.
 * - ROLE_GENERAL_ACCOUNTANT (ketoan_tong): Toàn quyền hạch toán chi tiết (Dashboard kế toán, Kho cơ sở, Đối soát CukCuk, Bảng lương). Tuyệt đối KHÔNG can thiệp Executive Cockpit độc quyền của Chủ Chuỗi, Head Chef hay Branch Manager.
 * - ROLE_QL_BEP (ql_bep_tn): Bếp Trưởng điều hành HeadChefDashboard (Duyệt báo hỏng, Giám sát mẻ, Đặt hàng NCC sheet BAOHANG), Bếp 4 nút, Đối soát nguyên liệu, Chấm công bếp. Tuyệt đối ẨN Kho chuỗi, Bảng lương, Executive Cockpit.
 * - ROLE_QL_CHINHANH (ql_chinhanh_tn): Quản lý chi nhánh điều hành BranchManagerCenter (Quân số GPS, Đăng ký ra ngoài sheet ĐĂNG KÝ RA NGOÀI, Ghi phạt sheet PHAT, Chấm thi tay nghề dao thớt). Tuyệt đối ẨN Kho NCC chuỗi & Executive Cockpit.
 * - ROLE_KITCHEN_STAFF (bep_tn): CHỈ thấy Bếp ('kitchen') và Cổng cá nhân ('attendance', 'exam', 'profile'). Tuyệt đối ẨN Kho, Đối soát, Bảng lương, Dashboard.
 * - ROLE_EMPLOYEE: CHỈ thấy Cổng cá nhân ('attendance', 'exam', 'profile', 'hr-attendance').
 */
export function isViewAuthorized(viewId: string, user: User | null | undefined): boolean {
  if (!user) return false;

  const isChuChuoi = userHasRole(user, 'ROLE_CHU_CHUOI') || user.username === 'admin_chu';
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
  const isEmp = userHasRole(user, 'ROLE_EMPLOYEE');
  const isHeadChef = userHasRole(user, 'ROLE_QL_BEP') || user.username === 'ql_bep_tn';
  const isBranchMgr = userHasRole(user, 'ROLE_QL_CHINHANH') || user.username === 'ql_chinhanh_tn';

  // 1. Chủ Chuỗi có toàn quyền truy cập tất cả các phân hệ của hệ thống
  if (isChuChuoi) return true;

  // 2. Phân hệ độc quyền của Chủ Chuỗi: Executive Cockpit
  if (viewId === 'executive-cockpit') {
    return isChuChuoi;
  }

  // 3. Phân hệ Bếp Trưởng: Head Chef Dashboard
  if (viewId === 'head-chef') {
    return isHeadChef || isChuChuoi;
  }

  // 4. Phân hệ Quản Lý Chi Nhánh: Branch Manager Command Center
  if (viewId === 'branch-manager') {
    return isBranchMgr || (isMgr && !isHeadChef) || isChuChuoi;
  }

  // 5. Kế toán tổng chuỗi có toàn quyền các phân hệ hạch toán & vận hành (trừ các màn hình độc quyền trên)
  if (isGenAcc) {
    if (viewId === 'executive-cockpit' || viewId === 'head-chef' || viewId === 'branch-manager') {
      return false;
    }
    return true;
  }

  // 6. Các vai trò cơ sở khác
  switch (viewId) {
    case 'dashboard':
      // Bếp viên và Nhân viên thuần túy không có quyền truy cập Dashboard
      return isMgr || isBrAcc || isBranchMgr;

    case 'kitchen':
      // Bếp viên, Bếp trưởng và Quản lý có quyền thao tác / giám sát bếp
      return isKitchen || isMgr || isHeadChef || isBranchMgr;

    case 'warehouse':
      // Kế toán chi nhánh, Bếp trưởng, Quản lý chi nhánh, Kế toán tổng, Chủ chuỗi và Bếp viên (xem tồn vật lý & cân hàng) (TASK-WH-01)
      return isKitchen || isBrAcc || isHeadChef || isBranchMgr || isGenAcc || isChuChuoi;

    case 'reconciliation':
      // Quản lý, Bếp trưởng và Kế toán xem đối soát cuối ngày CukCuk
      return isMgr || isBrAcc || isHeadChef || isBranchMgr;

    case 'hr-attendance':
    case 'attendance':
    case 'exam':
    case 'profile':
      // Cổng cá nhân cho toàn bộ nhân sự, hoặc Quản lý chi nhánh điều hành nhân sự
      return isEmp || isKitchen || isMgr || isBrAcc || isHeadChef || isBranchMgr;

    case 'payroll':
      // Kế toán chi nhánh quản lý bảng lương cơ sở & duyệt tạm ứng
      return isBrAcc;

    case 'kitchen-monitor':
      return false;

    default:
      return false;
  }
}

/**
 * Trả về màn hình mặc định hợp lệ cho người dùng khi đăng nhập hoặc khi chuyển đổi vai trò
 */
export function getDefaultAuthorizedView(
  user: User | null | undefined,
  isMobile = false
): string {
  if (!user) return isMobile ? 'attendance' : 'kitchen';

  const isChuChuoi = userHasRole(user, 'ROLE_CHU_CHUOI') || user.username === 'admin_chu';
  const isHeadChef = userHasRole(user, 'ROLE_QL_BEP') || user.username === 'ql_bep_tn';
  const isBranchMgr = userHasRole(user, 'ROLE_QL_CHINHANH') || user.username === 'ql_chinhanh_tn';
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
  const isEmp = userHasRole(user, 'ROLE_EMPLOYEE');

  // Chủ Chuỗi mặc định vào Bảng Chỉ Huy Giám Đốc (Executive Cockpit 10 Giây)
  if (isChuChuoi) {
    return 'executive-cockpit';
  }

  // Bếp Trưởng mặc định vào Trung Tâm Bếp Trưởng
  if (isHeadChef) {
    return 'head-chef';
  }

  // Quản Lý Chi Nhánh mặc định vào Store Manager Center
  if (isBranchMgr) {
    return 'branch-manager';
  }

  // Kế Toán Tổng mặc định vào Dashboard Kế Toán Tổng
  if (isGenAcc) {
    return 'dashboard';
  }

  // Quản lý chung
  if (isMgr) {
    return 'branch-manager';
  }

  // Kế toán chi nhánh
  if (isBrAcc) {
    return 'dashboard';
  }

  // Bếp viên
  if (isKitchen) {
    return 'kitchen';
  }

  // Nhân viên thông thường
  if (isEmp) {
    return isMobile ? 'attendance' : 'hr-attendance';
  }

  return isMobile ? 'attendance' : 'kitchen';
}

/**
 * Danh sách vai trò hiển thị thân thiện tiếng Việt
 */
export function getRoleDisplayBadges(roles: RoleName[] = []): string[] {
  const badges: string[] = [];
  if (roles.includes('ROLE_CHU_CHUOI')) badges.push('Chủ Chuỗi / Ban Giám Đốc');
  if (roles.includes('ROLE_QL_BEP')) badges.push('Bếp Trưởng Điều Hành');
  if (roles.includes('ROLE_QL_CHINHANH')) badges.push('Quản Lý Chi Nhánh');
  if (
    (roles.includes('ROLE_GENERAL_ACCOUNTANT') ||
      roles.includes('ROLE_KETOAN_TONG') ||
      roles.includes('ROLE_ACCOUNTANT')) &&
    !roles.includes('ROLE_CHU_CHUOI')
  ) {
    badges.push('Kế Toán Tổng Chuỗi');
  }
  if (
    (roles.includes('ROLE_BRANCH_ACCOUNTANT') || roles.includes('ROLE_KETOAN_CHINHANH')) &&
    !roles.includes('ROLE_CHU_CHUOI')
  ) {
    badges.push('Kế Toán Chi Nhánh');
  }
  if (roles.includes('ROLE_KITCHEN_STAFF') && !roles.includes('ROLE_QL_BEP') && !roles.includes('ROLE_CHU_CHUOI')) {
    badges.push('Bếp / Bar 4 Nút');
  }
  if (
    roles.includes('ROLE_RESTAURANT_MANAGER') &&
    !roles.includes('ROLE_QL_BEP') &&
    !roles.includes('ROLE_QL_CHINHANH') &&
    !roles.includes('ROLE_CHU_CHUOI')
  ) {
    badges.push('Quản Lý Nhà Hàng');
  }
  if (roles.includes('ROLE_EMPLOYEE') && badges.length === 0) {
    badges.push('Nhân Viên Phục Vụ');
  }
  return badges.length > 0 ? badges : ['Nhân Viên'];
}
