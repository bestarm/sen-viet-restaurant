import { db } from './schema';
import {
  SEED_BRANCHES,
  SEED_USERS,
  SEED_SUPPLIERS,
  SEED_ITEMS,
  SEED_RECIPES,
  SEED_BATCHES,
  SEED_DAMAGE_REPORTS,
  SEED_LINE_LOGS,
  SEED_TAKE_OUT_LOGS,
  SEED_INVENTORY_LOTS,
  SEED_WAREHOUSE_DOCUMENTS,
  SEED_INVENTORY_CHECKS,
  SEED_RECONCILIATIONS,
  SEED_ATTENDANCES,
  SEED_EXAM_QUESTIONS,
  SEED_EXAM_SUBMISSIONS,
  SEED_UNIFORM_ITEMS,
  SEED_UNIFORM_ALLOCATIONS,
  SEED_RESIGNATIONS,
  SEED_SALARY_ADVANCES,
  SEED_PAYROLL_PERIODS,
  SEED_PAYROLLS,
  SEED_INCREASE_PROPOSALS,
  SEED_DAILY_REMAINING,
  SEED_DAILY_MEALS,
  SEED_RECONCILIATION_PERIODS,
  SEED_DEBT_ADJUSTMENTS,
} from './seedData';

/**
 * Phiên bản dữ liệu mẫu (Cập nhật phiên bản sẽ kích hoạt tự động reset IndexedDB đồng bộ)
 */
export const SEED_DATA_VERSION = 'v2026_11_21_sprint_kho_v1';

let memorySeedVersion: string | null = null;

function getStoredVersion(): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return localStorage.getItem('senviet_seed_data_version');
    } catch {
      return memorySeedVersion;
    }
  }
  return memorySeedVersion;
}

function setStoredVersion(version: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('senviet_seed_data_version', version);
    } catch {}
  }
  memorySeedVersion = version;
}

/**
 * Giả lập độ trễ mạng thực tế (100 - 150ms) để giữ trọn vẹn trải nghiệm loading/spinner cho UI
 */
export async function simulateLatency(min = 100, max = 150): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Nạp dữ liệu mẫu vào IndexedDB nếu database trống hoặc có phiên bản seed data mới
 */
export async function initializeDatabaseIfEmpty(): Promise<boolean> {
  try {
    const storedVersion = getStoredVersion();
    const userCount = await db.users.count();

    // Nếu database trống HOẶC phiên bản seed data cũ -> Tự động nạp lại dữ liệu mẫu mới
    if (userCount === 0 || storedVersion !== SEED_DATA_VERSION) {
      console.log(
        `[Dexie DB] Phát hiện phiên bản seed mới (${SEED_DATA_VERSION}), khởi tạo lại dữ liệu mẫu...`
      );
      await resetToSeedData();
      setStoredVersion(SEED_DATA_VERSION);
      console.log('[Dexie DB] Khởi tạo thành công 100% dữ liệu mẫu mới!');
      return true;
    }

    // Tự động kiểm tra và nâng cấp quyền hạn nếu ketoan_tong hoặc admin_chu bị thiếu vai trò trong IndexedDB cũ
    try {
      const ktUser = await db.users.where('username').equals('ketoan_tong').first();
      if (ktUser && (!ktUser.roles.includes('ROLE_GENERAL_ACCOUNTANT') || !ktUser.roles.includes('ROLE_ACCOUNTANT'))) {
        const updatedRoles = Array.from(new Set([
          ...ktUser.roles,
          'ROLE_GENERAL_ACCOUNTANT',
          'ROLE_BRANCH_ACCOUNTANT',
          'ROLE_ACCOUNTANT',
          'ROLE_KETOAN_TONG',
        ]));
        await db.users.update(ktUser.id, { roles: updatedRoles });
        console.log('[Dexie DB] Đã tự động cập nhật đầy đủ quyền hạn cho Kế Toán Tổng (ketoan_tong)');
      }
      const adminUser = await db.users.where('username').equals('admin_chu').first();
      if (adminUser && !adminUser.roles.includes('ROLE_CHU_CHUOI')) {
        const updatedAdminRoles = Array.from(new Set([
          ...adminUser.roles,
          'ROLE_CHU_CHUOI',
          'ROLE_GENERAL_ACCOUNTANT',
        ]));
        await db.users.update(adminUser.id, { roles: updatedAdminRoles });
      }

      // Tự động kiểm tra và thêm tài khoản Kế toán Chi nhánh (ketoan_tn & ketoan_qv)
      const ktBranchUser = await db.users.where('username').equals('ketoan_tn').first();
      if (!ktBranchUser) {
        await db.users.add({
          id: 7,
          username: 'ketoan_tn',
          fullName: 'Nguyễn Thu Thủy',
          email: 'ketoan_tn@senvietbuffet.vn',
          phone: '0987778899',
          branchId: 1,
          branchCode: 'TN',
          branchName: 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
          department: 'Kế toán',
          position: 'Kế toán chi nhánh',
          baseSalary: 9500000,
          insuranceRate: 0.11,
          insuranceAmount: 1045000,
          bankAccount: '19034567891012',
          bankName: 'Techcombank',
          roles: [
            'ROLE_KETOAN_CHINHANH',
            'ROLE_BRANCH_ACCOUNTANT',
            'ROLE_ACCOUNTANT',
            'ROLE_EMPLOYEE',
          ],
          status: 'ACTIVE',
        });
        console.log('[Dexie DB] Đã tự động tạo tài khoản Kế Toán Chi Nhánh (ketoan_tn)');
      } else if (!ktBranchUser.roles.includes('ROLE_KETOAN_CHINHANH')) {
        await db.users.update(ktBranchUser.id, {
          roles: Array.from(new Set([...ktBranchUser.roles, 'ROLE_KETOAN_CHINHANH', 'ROLE_BRANCH_ACCOUNTANT'])),
        });
      }

      const ktQVUser = await db.users.where('username').equals('ketoan_qv').first();
      if (!ktQVUser) {
        await db.users.add({
          id: 8,
          username: 'ketoan_qv',
          fullName: 'Trần Thị Lan',
          email: 'ketoan_qv@senvietbuffet.vn',
          phone: '0988889900',
          branchId: 2,
          branchCode: 'QV',
          branchName: 'Sen Việt Buffet - Chi nhánh Quế Võ',
          department: 'Kế toán',
          position: 'Kế toán chi nhánh Quế Võ',
          baseSalary: 9500000,
          insuranceRate: 0.105,
          insuranceAmount: 997500,
          bankAccount: '0381000123456',
          bankName: 'Vietcombank',
          roles: [
            'ROLE_KETOAN_CHINHANH',
            'ROLE_BRANCH_ACCOUNTANT',
            'ROLE_ACCOUNTANT',
            'ROLE_EMPLOYEE',
          ],
          status: 'ACTIVE',
        });
        console.log('[Dexie DB] Đã tự động tạo tài khoản Kế Toán Chi Nhánh (ketoan_qv)');
      } else if (!ktQVUser.roles.includes('ROLE_KETOAN_CHINHANH')) {
        await db.users.update(ktQVUser.id, {
          roles: Array.from(new Set([...ktQVUser.roles, 'ROLE_KETOAN_CHINHANH', 'ROLE_BRANCH_ACCOUNTANT'])),
        });
      }
    } catch (e) {
      console.warn('[Dexie DB] Bỏ qua kiểm tra nâng cấp quyền người dùng:', e);
    }

    return false;
  } catch (error) {
    console.error('[Dexie DB] Lỗi khởi tạo database nhúng:', error);
    return false;
  }
}

/**
 * Đặt lại (Reset) 1-Click toàn bộ cơ sở dữ liệu về trạng thái ban đầu của Sen Việt Buffet
 */
export async function resetToSeedData(): Promise<void> {
  console.log('[Dexie DB] Đang xóa dữ liệu cũ và nạp lại Seed Data...');
  await db.transaction(
    'rw',
    [
      db.branches,
      db.users,
      db.suppliers,
      db.items,
      db.recipes,
      db.batches,
      db.damageReports,
      db.lineLogs,
      db.takeOutLogs,
      db.inventoryLots,
      db.warehouseDocuments,
      db.inventoryChecks,
      db.reconciliations,
      db.attendances,
      db.examQuestions,
      db.examSubmissions,
      db.uniformItems,
      db.uniformAllocations,
      db.resignationRequests,
      db.salaryAdvances,
      db.payrollPeriods,
      db.payrollRecords,
      db.salaryIncreaseProposals,
      db.dailyRemaining,
      db.dailyMeals,
      db.debtAdjustments,
      db.reconciliationPeriods,
    ],
    async () => {
      await db.branches.clear();
      await db.users.clear();
      await db.suppliers.clear();
      await db.items.clear();
      await db.recipes.clear();
      await db.batches.clear();
      await db.damageReports.clear();
      await db.lineLogs.clear();
      await db.takeOutLogs.clear();
      await db.inventoryLots.clear();
      await db.warehouseDocuments.clear();
      await db.inventoryChecks.clear();
      await db.reconciliations.clear();
      await db.attendances.clear();
      await db.examQuestions.clear();
      await db.examSubmissions.clear();
      await db.uniformItems.clear();
      await db.uniformAllocations.clear();
      await db.resignationRequests.clear();
      await db.salaryAdvances.clear();
      await db.payrollPeriods.clear();
      await db.payrollRecords.clear();
      await db.salaryIncreaseProposals.clear();
      await db.dailyRemaining.clear();
      await db.dailyMeals.clear();
      await db.debtAdjustments.clear();
      await db.reconciliationPeriods.clear();

      await populateAllSeedData();
    }
  );
  setStoredVersion(SEED_DATA_VERSION);
  console.log('[Dexie DB] Đã Reset dữ liệu thành công!');
}

async function populateAllSeedData(): Promise<void> {
  await db.branches.bulkAdd(SEED_BRANCHES);
  await db.users.bulkAdd(SEED_USERS);
  await db.suppliers.bulkAdd(SEED_SUPPLIERS);
  await db.items.bulkAdd(SEED_ITEMS);
  await db.recipes.bulkAdd(SEED_RECIPES);
  await db.batches.bulkAdd(SEED_BATCHES);
  await db.damageReports.bulkAdd(SEED_DAMAGE_REPORTS);
  await db.lineLogs.bulkAdd(SEED_LINE_LOGS);
  await db.takeOutLogs.bulkAdd(SEED_TAKE_OUT_LOGS);
  await db.inventoryLots.bulkAdd(SEED_INVENTORY_LOTS);
  await db.warehouseDocuments.bulkAdd(SEED_WAREHOUSE_DOCUMENTS);
  await db.inventoryChecks.bulkAdd(SEED_INVENTORY_CHECKS);
  await db.reconciliations.bulkAdd(SEED_RECONCILIATIONS);
  await db.attendances.bulkAdd(SEED_ATTENDANCES);
  await db.examQuestions.bulkAdd(SEED_EXAM_QUESTIONS);
  await db.examSubmissions.bulkAdd(SEED_EXAM_SUBMISSIONS);
  await db.uniformItems.bulkAdd(SEED_UNIFORM_ITEMS);
  await db.uniformAllocations.bulkAdd(SEED_UNIFORM_ALLOCATIONS);
  await db.resignationRequests.bulkAdd(SEED_RESIGNATIONS);
  await db.salaryAdvances.bulkAdd(SEED_SALARY_ADVANCES);
  await db.payrollPeriods.bulkAdd(SEED_PAYROLL_PERIODS);
  await db.payrollRecords.bulkAdd(SEED_PAYROLLS);
  await db.salaryIncreaseProposals.bulkAdd(SEED_INCREASE_PROPOSALS);
  await db.dailyRemaining.bulkAdd(SEED_DAILY_REMAINING);
  await db.dailyMeals.bulkAdd(SEED_DAILY_MEALS);
  await db.debtAdjustments.bulkAdd(SEED_DEBT_ADJUSTMENTS);
  await db.reconciliationPeriods.bulkAdd(SEED_RECONCILIATION_PERIODS);
}
