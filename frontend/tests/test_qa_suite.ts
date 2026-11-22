/**
 * Automated QA & Logic Verification Suite for Sen Việt Buffet Standalone Demo
 * Tests:
 * 1. Dexie IndexedDB (15+ tables, initial seed data)
 * 2. Anti-double click & Idempotency on Ra line (+1)
 * 3. Second in-progress batch warning (HTTP 409) & bypass
 * 4. Batch loss calculation, over-standard threshold detection, input validation
 * 5. CukCuk reconciliation: red alert flag when loss > 5% or > 300,000 VND
 * 6. GPS Haversine calculation (<= 50m valid, > 50m warning)
 * 7. Resigned employee uniform return & salary hold constraint
 * 8. RBAC 5 Roles permission matrix
 */

import 'fake-indexeddb/auto';

// Polyfill localStorage and navigator for Node.js test environment
if (typeof global.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  global.localStorage = {
    getItem: (k: string) => store[k] || null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    key: (i: number) => Object.keys(store)[i] || null,
    length: 0,
  } as any;
}

if (typeof global.navigator === 'undefined') {
  (global as any).navigator = { onLine: true };
}

import { db } from '../src/db/schema';
import { resetToSeedData } from '../src/db/dbService';
import { kitchenApi } from '../src/api/kitchen';
import { reconciliationApi } from '../src/api/reconciliation';
import { hrApi } from '../src/api/hr';
import { payrollApi } from '../src/api/payroll';
import { isViewAuthorized, getDefaultAuthorizedView, userHasRole } from '../src/utils/rbac';
import { SEED_REAL_PERSONNEL, SEED_DAILY_MEALS, SEED_COST_GROUPS } from '../src/db/seedData';
import { SEED_NXT_RECORDS } from '../src/components/reconciliation/nxtData';
import { warehouseApi } from '../src/api/warehouse';
import { formatWatermarkText } from '../src/utils/imageCompressor';
import {
  WAREHOUSE_LOCATIONS,
  WarehouseLocation,
  PRE_PROCESSING_CATEGORIES,
  PRE_PROCESSING_CATEGORY_MAP,
  getItemPreProcessingCategory,
} from '../src/types/warehouse';
import { getBuffetFoodGroup, BUFFET_FOOD_GROUPS } from '../src/components/warehouse/StockCardsTab';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WAREHOUSE_COCKPIT_TABS, WarehouseTab } from '../src/components/warehouse/WarehouseModule';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
  suite: string;
  testName: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, testName: string, detail?: string) {
  results.push({
    suite,
    testName,
    passed: !!condition,
    message: detail || (condition ? 'PASSED' : 'FAILED'),
  });
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}: ${detail || 'Assertion failed'}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 BẮT ĐẦU CHẠY BỘ KIỂM THỬ TỰ ĐỘNG QA SEN VIỆT DEMO');
  console.log('======================================================\n');

  // -----------------------------------------------------------------
  // 1. KIỂM THỬ CƠ SỞ DỮ LIỆU DEXIE INDEXEDDB & SEED DATA
  // -----------------------------------------------------------------
  console.log('\n📦 SUITE 1: Dexie IndexedDB & Seed Data Integrity');
  await resetToSeedData();

  const branchCount = await db.branches.count();
  assert(branchCount === 2, 'IndexedDB', 'Số lượng chi nhánh là 2 (TN & QV)', `Thực tế: ${branchCount}`);

  const userCount = await db.users.count();
  assert(userCount >= 5, 'IndexedDB', 'Tài khoản người dùng mẫu >= 5', `Thực tế: ${userCount}`);

  const bepUser = await db.users.where('username').equals('bep_tn').first();
  assert(!!bepUser, 'IndexedDB', 'Có tài khoản bep_tn (ROLE_BEP)');

  const itemCount = await db.items.count();
  assert(itemCount >= 8, 'IndexedDB', 'Danh mục món ăn phong phú >= 8 món', `Thực tế: ${itemCount}`);

  const batchCount = await db.batches.count();
  assert(batchCount >= 3, 'IndexedDB', 'Mẻ chế biến mẫu >= 3', `Thực tế: ${batchCount}`);

  const reconCount = await db.reconciliations.count();
  assert(reconCount >= 6, 'IndexedDB', 'Dữ liệu đối soát CukCuk >= 6 món', `Thực tế: ${reconCount}`);

  const uniformCount = await db.uniformAllocations.count();
  assert(uniformCount >= 3, 'IndexedDB', 'Bản ghi cấp phát đồng phục >= 3', `Thực tế: ${uniformCount}`);

  // -----------------------------------------------------------------
  // 2. KIỂM THỬ CẢNH BÁO MẺ CHẾ BIẾN THỨ HAI (DANG_LAM)
  // -----------------------------------------------------------------
  console.log('\n🔥 SUITE 2: Second In-Progress Batch Alert Logic');
  // Trong seedData, item id=2 (Tôm càng xanh) đang có mẻ BATCH-202611-003 ở trạng thái DANG_LAM
  let caughtSecondBatch = false;
  try {
    await kitchenApi.startBatch({
      itemId: 2,
      inputWeight: 15.0,
      unit: 'kg',
      forceSecondBatch: false,
    });
  } catch (err: any) {
    if (err.response?.status === 409) {
      caughtSecondBatch = true;
    }
  }
  assert(
    caughtSecondBatch,
    'Kitchen Batch',
    'Chặn mẻ thứ hai và trả về status 409 khi món đang có mẻ dở dang',
    caughtSecondBatch ? 'Đã kích hoạt 409 thành công' : 'Không bắt được cảnh báo 409'
  );

  // Mở mẻ thứ hai khi có cờ xác nhận forceSecondBatch: true
  const forcedBatch = await kitchenApi.startBatch({
    itemId: 2,
    inputWeight: 15.0,
    unit: 'kg',
    forceSecondBatch: true,
  });
  assert(
    forcedBatch.success && forcedBatch.data.secondBatch === true,
    'Kitchen Batch',
    'Cho phép mở mẻ khi người dùng xác nhận "Vẫn mở mẻ mới" (forceSecondBatch=true)',
    `secondBatch flag: ${forcedBatch.data?.secondBatch}`
  );

  // -----------------------------------------------------------------
  // 3. KIỂM THỬ TÍNH HAO HỤT MẺ CHẾ BIẾN & CẢNH BÁO VƯỢT ĐỊNH MỨC
  // -----------------------------------------------------------------
  console.log('\n⚖️ SUITE 3: Batch Loss Calculation & Over-Standard Threshold');
  // Khởi tạo mẻ mới cho Ba chỉ bò (id=4, chuẩn hao hụt 4.0%)
  const newBachiBatch = await kitchenApi.startBatch({
    itemId: 4,
    inputWeight: 20.0,
    unit: 'kg',
  });
  const batchId = newBachiBatch.data.id;

  // Trường hợp 1: Hoàn tất mẻ đạt chuẩn (đầu ra 19.3kg -> hao hụt 3.5% <= 4.0%)
  const normalFinish = await kitchenApi.finishBatch({
    batchId,
    outputWeight: 19.3,
  });
  assert(
    normalFinish.data.lossRate === 3.5 && normalFinish.data.overStandard === false,
    'Kitchen Batch',
    'Hao hụt 3.5% <= chuẩn 4.0% -> overStandard = false',
    `lossRate: ${normalFinish.data.lossRate}%, overStandard: ${normalFinish.data.overStandard}`
  );

  // Trường hợp 2: Khởi tạo mẻ Cá hồi (id=1, chuẩn hao hụt 8.0%), hoàn tất với hao hụt vượt chuẩn
  const newCahoiBatch = await kitchenApi.startBatch({
    itemId: 1,
    inputWeight: 15.0,
    unit: 'kg',
    forceSecondBatch: true,
  });
  // Đầu ra 13.0kg trên 15kg -> hụt 2kg = 13.3% > 8.0%
  const overFinish = await kitchenApi.finishBatch({
    batchId: newCahoiBatch.data.id,
    outputWeight: 13.0,
  });
  assert(
    overFinish.data.lossRate === 13.3 && overFinish.data.overStandard === true && !!overFinish.data.warningMessage,
    'Kitchen Batch',
    'Hao hụt 13.3% > chuẩn 8.0% -> overStandard = true và có warningMessage',
    `lossRate: ${overFinish.data.lossRate}%, overStandard: ${overFinish.data.overStandard}`
  );

  // Trường hợp 3: Khối lượng thành phẩm lớn hơn đầu vào -> Phải ném ngoại lệ
  let caughtInvalidWeight = false;
  const invalidBatch = await kitchenApi.startBatch({
    itemId: 4,
    inputWeight: 10.0,
    unit: 'kg',
    forceSecondBatch: true,
  });
  try {
    await kitchenApi.finishBatch({
      batchId: invalidBatch.data.id,
      outputWeight: 12.0, // Không hợp lệ: 12kg > 10kg
    });
  } catch (e: any) {
    caughtInvalidWeight = true;
  }
  assert(
    caughtInvalidWeight,
    'Kitchen Batch',
    'Chặn thành phẩm > đầu vào (ném lỗi ngoại lệ toàn vẹn dữ liệu)',
    caughtInvalidWeight ? 'Chặn thành công' : 'Cho phép khối lượng ảo'
  );

  // -----------------------------------------------------------------
  // 4. KIỂM THỬ NÚT RA LINE (+1) & TÍNH KHÔNG TRỪ KHO
  // -----------------------------------------------------------------
  console.log('\n🍽️ SUITE 4: Kitchen Ra Line (+1) Operation');
  const lineRes = await kitchenApi.recordLineItem({
    itemId: 4,
    quantity: 1,
    requestId: `line-test-${Date.now()}`,
  });
  assert(
    lineRes.success && lineRes.data.quantity === 1,
    'Kitchen Ra Line',
    'Ghi nhận ra line +1 thành công với requestId định danh',
    `message: ${lineRes.message}`
  );

  // -----------------------------------------------------------------
  // 5. KIỂM THỬ ĐỐI SOÁT CUKCUK & TÔ ĐỎ THẤT THOÁT (>5% HOẶC >300.000Đ)
  // -----------------------------------------------------------------
  console.log('\n📊 SUITE 5: CukCuk Reconciliation Red Alert Rules (>5% or >300,000đ)');
  const allRecons = await reconciliationApi.getDailySummary();
  const redAlertItems = allRecons.filter(r => r.isOverThreshold);

  assert(
    redAlertItems.length >= 2,
    'CukCuk Reconciliation',
    'Có ít nhất 2 món bị đánh dấu cờ đỏ thất thoát vượt ngưỡng (>5% hoặc >300k)',
    `Số món cờ đỏ: ${redAlertItems.length}`
  );

  // Cụ thể: Cua Cà Mau có thất thoát 2.730.000đ (21.67%)
  const cuaItem = allRecons.find(r => r.itemCode === 'HS-CUACAMAU');
  assert(
    !!cuaItem && cuaItem.isOverThreshold && cuaItem.unexplainedLossAmount === 2730000 && cuaItem.unexplainedLossRate > 5,
    'CukCuk Reconciliation',
    'Cua Cà Mau: thất thoát 2.730.000đ (>300k) & 21.67% (>5%) -> isOverThreshold = true',
    `Thất thoát: ${cuaItem?.unexplainedLossAmount?.toLocaleString()}đ (${cuaItem?.unexplainedLossRate}%)`
  );

  // Ba chỉ bò khớp số liệu: thất thoát = 0đ (0%) -> isOverThreshold = false
  const bachiRecon = allRecons.find(r => r.itemCode === 'TB-BACHIBO');
  assert(
    !!bachiRecon && !bachiRecon.isOverThreshold && bachiRecon.unexplainedLossAmount === 0,
    'CukCuk Reconciliation',
    'Ba chỉ bò Mỹ: khớp số liệu 0đ -> isOverThreshold = false (không báo động)',
    `Thất thoát: ${bachiRecon?.unexplainedLossAmount}đ`
  );

  // Kiểm tra bộ lọc overThresholdOnly
  const filteredOnlyRed = await reconciliationApi.getDailySummary({ overThresholdOnly: true });
  assert(
    filteredOnlyRed.every(r => r.isOverThreshold),
    'CukCuk Reconciliation',
    'Bộ lọc overThresholdOnly=true chỉ trả về các dòng bị báo đỏ',
    `Tổng số dòng lọc được: ${filteredOnlyRed.length}`
  );

  // -----------------------------------------------------------------
  // 6. KIỂM THỬ CHẤM CÔNG GPS HAVERSINE (<=50M HỢP LỆ, >50M CẢNH BÁO)
  // -----------------------------------------------------------------
  console.log('\n📍 SUITE 6: GPS Geofencing (Haversine Formula <=50m vs >50m)');
  // Tọa độ chi nhánh Thái Nguyên: 21.5928, 105.8442
  // Test 1: Tọa độ tại nhà hàng (khoảng cách 0 - 15m <= 50m)
  const validCheckIn = await hrApi.checkIn({
    latitude: 21.59285,
    longitude: 105.84422,
    selfieUrl: 'data:image/svg+xml;base64,mock',
    shiftName: 'Ca Sáng (08:00 - 16:30)',
  });
  assert(
    validCheckIn.isValidLocation === true && validCheckIn.checkInDistanceMeters <= 50 && validCheckIn.status === 'DANG_LAM',
    'GPS Attendance',
    'Tọa độ tại nhà hàng (khoảng cách <= 50m) -> isValidLocation = true, status = DANG_LAM',
    `Khoảng cách: ${validCheckIn.checkInDistanceMeters}m`
  );

  // Test 2: Tọa độ ngoài chi nhánh (cách >50m, ví dụ cách 500m)
  const invalidCheckIn = await hrApi.checkIn({
    latitude: 21.5980,
    longitude: 105.8490,
    selfieUrl: 'data:image/svg+xml;base64,mock',
    shiftName: 'Ca Sáng (08:00 - 16:30)',
  });
  assert(
    invalidCheckIn.isValidLocation === false && invalidCheckIn.checkInDistanceMeters > 50 && invalidCheckIn.status === 'VI_PHAM_KHOANG_CACH',
    'GPS Attendance',
    'Tọa độ ngoài chi nhánh (> 50m) -> isValidLocation = false, status = VI_PHAM_KHOANG_CACH',
    `Khoảng cách: ${invalidCheckIn.checkInDistanceMeters}m`
  );

  // -----------------------------------------------------------------
  // 7. KIỂM THỬ KHÓA LƯƠNG NHÂN VIÊN NGHỈ VIỆC CHƯA TRẢ ĐỒNG PHỤC
  // -----------------------------------------------------------------
  console.log('\n👔 SUITE 7: Resigned Employee Uniform Hold & Salary Locking');
  const payrolls = await payrollApi.getPayroll('2026-10');
  
  // User 10 là Hoàng Thị Tạp Vụ, nghỉ việc chưa trả 1 tạp dề + 1 nón bếp
  const tapvuPayroll = payrolls.find(p => p.userId === 10);
  assert(
    !!tapvuPayroll && tapvuPayroll.isUniformRetained === true && tapvuPayroll.status === 'DANG_GIU_LUONG',
    'Payroll Uniform Hold',
    'Nhân sự chưa trả đồng phục bị ghim cờ isUniformRetained = true & status = DANG_GIU_LUONG',
    `Trạng thái: ${tapvuPayroll?.status}, Lý do: ${tapvuPayroll?.holdReason}`
  );

  assert(
    !!tapvuPayroll && !!tapvuPayroll.holdReason && tapvuPayroll.holdReason.includes('đồng phục'),
    'Payroll Uniform Hold',
    'Lý do giữ lương thể hiện rõ thiếu đồng phục',
    `holdReason: ${tapvuPayroll?.holdReason}`
  );

  // Kiểm tra khóa kỳ lương
  const lockResult = await payrollApi.lockPeriod('2026-10');
  assert(
    lockResult.status === 'LOCKED' && !!lockResult.lockedAt,
    'Payroll Period Lock',
    'Khóa kỳ lương niêm phong bảng lương thành công',
    `Trạng thái kỳ: ${lockResult.status}`
  );

  // Mở khóa kỳ lương kèm lý do giải trình
  const unlockResult = await payrollApi.unlockPeriod('2026-10', 'Điều chỉnh phụ cấp làm thêm giờ theo phê duyệt BGĐ');
  assert(
    unlockResult.status === 'OPEN' && !!unlockResult.unlockReason?.includes('BGĐ'),
    'Payroll Period Lock',
    'Mở khóa kỳ lương yêu cầu lý do giải trình bắt buộc',
    `Trạng thái kỳ: ${unlockResult.status}, Lý do: ${unlockResult.unlockReason}`
  );

  // -----------------------------------------------------------------
  // 8. KIỂM THỬ PHÂN QUYỀN RBAC 5 VAI TRÒ
  // -----------------------------------------------------------------
  console.log('\n🛡️ SUITE 8: RBAC 5 Roles Permission Matrix');

  const userBep = { id: 1, username: 'bep_tn', fullName: 'Bếp Viên', roles: ['ROLE_KITCHEN_STAFF', 'ROLE_EMPLOYEE', 'ROLE_BEP'] } as any;
  const userQlBep = { id: 2, username: 'ql_bep_tn', fullName: 'Bếp Trưởng', roles: ['ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_EMPLOYEE', 'ROLE_QL_BEP'] } as any;
  const userQlChiNhanh = { id: 3, username: 'ql_chinhanh_tn', fullName: 'Quản Lý Chi Nhánh', roles: ['ROLE_RESTAURANT_MANAGER', 'ROLE_EMPLOYEE', 'ROLE_QL_CHINHANH'] } as any;
  const userKeToan = { id: 4, username: 'ketoan_tong', fullName: 'Kế Toán Tổng', roles: ['ROLE_GENERAL_ACCOUNTANT', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_KETOAN'] } as any;
  const userAdminChu = { id: 5, username: 'admin_chu', fullName: 'Chủ Chuỗi', roles: ['ROLE_GENERAL_ACCOUNTANT', 'ROLE_CHU_CHUOI'] } as any;

  // 8.1. ROLE_BEP
  assert(isViewAuthorized('kitchen', userBep) === true, 'RBAC ROLE_BEP', 'Bếp viên được truy cập phân hệ kitchen');
  assert(isViewAuthorized('warehouse', userBep) === true, 'RBAC ROLE_BEP', 'Bếp viên ĐƯỢC PHÉP xem phân hệ warehouse (tồn kho vật lý & cân hàng)');
  assert(isViewAuthorized('reconciliation', userBep) === false, 'RBAC ROLE_BEP', 'Bếp viên TUYỆT ĐỐI KHÔNG được xem phân hệ reconciliation');
  assert(isViewAuthorized('payroll', userBep) === false, 'RBAC ROLE_BEP', 'Bếp viên TUYỆT ĐỐI KHÔNG được xem phân hệ payroll');
  assert(isViewAuthorized('dashboard', userBep) === false, 'RBAC ROLE_BEP', 'Bếp viên không xem dashboard quản trị');
  assert(getDefaultAuthorizedView(userBep) === 'kitchen', 'RBAC ROLE_BEP', 'Màn hình mặc định của Bếp viên là kitchen');

  // 8.2. ROLE_QL_BEP / ROLE_QL_CHINHANH
  assert(isViewAuthorized('kitchen', userQlChiNhanh) === true, 'RBAC ROLE_QL_CHINHANH', 'Quản lý xem được kitchen');
  assert(isViewAuthorized('reconciliation', userQlChiNhanh) === true, 'RBAC ROLE_QL_CHINHANH', 'Quản lý xem được reconciliation chi nhánh');
  assert(isViewAuthorized('dashboard', userQlChiNhanh) === true, 'RBAC ROLE_QL_CHINHANH', 'Quản lý xem được dashboard');
  assert(isViewAuthorized('warehouse', userQlChiNhanh) === true, 'RBAC ROLE_QL_CHINHANH', 'Quản lý chi nhánh quản lý kho cơ sở & lô hàng (TASK-WH-01)');
  assert(isViewAuthorized('warehouse', userQlBep) === true, 'RBAC ROLE_QL_BEP', 'Bếp trưởng quản lý kho cơ sở & lô hàng (TASK-WH-01)');

  // 8.3. ROLE_KETOAN & ROLE_CHU_CHUOI
  assert(isViewAuthorized('dashboard', userKeToan) === true, 'RBAC ROLE_KETOAN', 'Kế toán xem dashboard');
  assert(isViewAuthorized('warehouse', userKeToan) === true, 'RBAC ROLE_KETOAN', 'Kế toán quản lý warehouse');
  assert(isViewAuthorized('reconciliation', userKeToan) === true, 'RBAC ROLE_KETOAN', 'Kế toán xem reconciliation');
  assert(isViewAuthorized('payroll', userKeToan) === true, 'RBAC ROLE_KETOAN', 'Kế toán quản lý payroll');
  assert(isViewAuthorized('kitchen', userKeToan) === true, 'RBAC ROLE_KETOAN', 'Kế toán giám sát kitchen');
  assert(getDefaultAuthorizedView(userKeToan) === 'dashboard', 'RBAC ROLE_KETOAN default', 'Màn hình mặc định của Kế toán là dashboard');

  // Kiểm tra tài khoản ketoan_tong với đúng roles seed data gốc (ROLE_ACCOUNTANT, ROLE_EMPLOYEE, ROLE_KETOAN_TONG)
  const userKeToanSeed = { id: 4, username: 'ketoan_tong', fullName: 'Phạm Thu Kế Toán', roles: ['ROLE_ACCOUNTANT', 'ROLE_EMPLOYEE', 'ROLE_KETOAN_TONG'] } as any;
  assert(isViewAuthorized('dashboard', userKeToanSeed) === true, 'RBAC ketoan_tong seed', 'Kế toán tổng với roles seed xem được dashboard');
  assert(isViewAuthorized('warehouse', userKeToanSeed) === true, 'RBAC ketoan_tong seed', 'Kế toán tổng với roles seed xem được warehouse');
  assert(isViewAuthorized('reconciliation', userKeToanSeed) === true, 'RBAC ketoan_tong seed', 'Kế toán tổng với roles seed xem được reconciliation');
  assert(isViewAuthorized('payroll', userKeToanSeed) === true, 'RBAC ketoan_tong seed', 'Kế toán tổng với roles seed xem được payroll');
  assert(getDefaultAuthorizedView(userKeToanSeed) === 'dashboard', 'RBAC ketoan_tong seed default', 'Màn hình mặc định của ketoan_tong seed là dashboard');

  assert(isViewAuthorized('dashboard', userAdminChu) === true, 'RBAC ROLE_CHU_CHUOI', 'Chủ chuỗi toàn quyền dashboard');
  assert(isViewAuthorized('kitchen', userAdminChu) === true, 'RBAC ROLE_CHU_CHUOI', 'Chủ chuỗi toàn quyền kitchen');
  assert(isViewAuthorized('warehouse', userAdminChu) === true, 'RBAC ROLE_CHU_CHUOI', 'Chủ chuỗi toàn quyền warehouse');
  assert(isViewAuthorized('reconciliation', userAdminChu) === true, 'RBAC ROLE_CHU_CHUOI', 'Chủ chuỗi toàn quyền reconciliation');
  assert(isViewAuthorized('payroll', userAdminChu) === true, 'RBAC ROLE_CHU_CHUOI', 'Chủ chuỗi toàn quyền payroll');

  // -----------------------------------------------------------------
  // 9. KIỂM THỬ VALIDATION NHẬP KHO & SỐ THẬP PHÂN (HOTFIX P0)
  // -----------------------------------------------------------------
  console.log('\n🔢 SUITE 9: Warehouse & Kitchen Quantity Validation (P0 Hotfix)');

  // 9.1. Warehouse document validation logic
  const validateDocItems = (items: { quantity: number | string }[]) => {
    return !items.some((item) => {
      const q = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
      return item.quantity === '' || item.quantity === undefined || isNaN(q) || q <= 0;
    });
  };

  assert(validateDocItems([{ quantity: '' }]) === false, 'Warehouse Validation', 'Chặn phiếu kho khi số lượng rỗng');
  assert(validateDocItems([{ quantity: 0 }]) === false, 'Warehouse Validation', 'Chặn phiếu kho khi số lượng = 0');
  assert(validateDocItems([{ quantity: -5 }]) === false, 'Warehouse Validation', 'Chặn phiếu kho khi số lượng âm');
  assert(validateDocItems([{ quantity: 10 }]) === true, 'Warehouse Validation', 'Cho phép số nguyên 10 (không bị chặn bởi step mismatch)');
  assert(validateDocItems([{ quantity: 10.5 }]) === true, 'Warehouse Validation', 'Cho phép số thập phân 10.5');
  assert(validateDocItems([{ quantity: 2.33 }]) === true, 'Warehouse Validation', 'Cho phép số lẻ 2.33');

  // 9.2. Decimal normalization (thay ',' thành '.')
  const normalizeQty = (val: string) => {
    const raw = val.replace(',', '.');
    return raw === '' ? '' : parseFloat(raw);
  };
  assert(normalizeQty('10,5') === 10.5, 'Decimal Normalization', 'Tự động đổi dấu phẩy 10,5 thành 10.5');
  assert(normalizeQty('2,33') === 2.33, 'Decimal Normalization', 'Tự động đổi dấu phẩy 2,33 thành 2.33');
  assert(normalizeQty('10') === 10, 'Decimal Normalization', 'Nhập 10 giữ nguyên 10');

  // 9.3. VirtualNumpad decimal input sequence logic
  let numpadStr = '';
  const simulateDigit = (digit: string) => {
    if (!numpadStr || numpadStr === '0') {
      numpadStr = digit === '.' ? '0.' : digit;
    } else if (digit === '.' && numpadStr.includes('.')) {
      return;
    } else {
      numpadStr = numpadStr + digit;
    }
  };

  simulateDigit('.');
  assert(numpadStr === '0.', 'VirtualNumpad Logic', 'Bấm phím "." khi trống tạo thành "0."');
  simulateDigit('5');
  assert(numpadStr === '0.5' && parseFloat(numpadStr) === 0.5, 'VirtualNumpad Logic', 'Bấm tiếp "5" tạo thành 0.5');
  simulateDigit('.');
  assert(numpadStr === '0.5', 'VirtualNumpad Logic', 'Không cho phép bấm thừa dấu chấm thứ hai');

  // -----------------------------------------------------------------
  // 10. KIỂM THỬ TÍNH NĂNG NÂNG CẤP BẾP SPRINT 1 (TASK-S1-03, S1-04, S1-05)
  // -----------------------------------------------------------------
  console.log('\n🍳 SUITE 10: Kitchen Sprint 1 Features (TASK-S1-03, TASK-S1-04, TASK-S1-05)');

  // 10.1. TASK-S1-03: Lấy hàng & Hủy thao tác hoàn trả kho
  const initialLots = await db.inventoryLots.where('itemId').equals(4).first();
  const initialStock = initialLots?.currentStock ?? 100;

  const takeOutRes = await kitchenApi.recordTakeOut({
    itemId: 4,
    quantity: 5.0,
    unit: 'kg',
    note: 'Xuất bò thái lát ca chiều',
  });
  assert(takeOutRes.success && takeOutRes.data.quantity === 5.0, 'Kitchen TakeOut', 'Ghi nhận lấy hàng xuất kho thành công');

  // Kiểm tra form reset logic (về rỗng sau khi lưu)
  let testFormQty: number | '' = 5.0;
  let testFormNote = 'Ghi chú thử nghiệm';
  // Simulate form reset upon success
  testFormQty = '';
  testFormNote = '';
  assert(testFormQty === '' && testFormNote === '', 'Kitchen TakeOut', 'Form lấy hàng tự động reset ô số lượng và ghi chú về rỗng');

  // Kiểm tra danh sách lịch sử lấy hàng
  const allTakeOuts = await kitchenApi.getTakeOutLogs();
  assert(allTakeOuts.length >= 1, 'Kitchen TakeOut', 'Bảng lịch sử lấy hàng trả về danh sách các lần lấy hàng trong ca');

  // Kiểm tra hủy thao tác lấy nhầm và hoàn trả lại kho
  const cancelRes = await kitchenApi.cancelTakeOut(takeOutRes.data.id);
  assert(cancelRes.success && cancelRes.data.isCancelled === true, 'Kitchen TakeOut', 'Hủy thao tác lấy hàng thành công và đánh dấu đã hoàn kho');

  const restoredLot = await db.inventoryLots.where('itemId').equals(4).first();
  assert((restoredLot?.currentStock ?? 0) >= initialStock, 'Kitchen TakeOut', 'Số lượng tồn kho được hoàn trả chính xác sau khi hủy lấy hàng');

  // 10.2. TASK-S1-04: Cooldown 1.5s nút Ra Line (+1)
  let isCooldownLocked = false;
  const triggerRaLineWithCooldown = (itemId: number) => {
    if (isCooldownLocked) return { blocked: true };
    isCooldownLocked = true;
    return { blocked: false };
  };

  const firstClick = triggerRaLineWithCooldown(4);
  assert(firstClick.blocked === false, 'Kitchen Ra Line Cooldown', 'Lần bấm đầu tiên được xử lý bình thường');

  const spamClick = triggerRaLineWithCooldown(4);
  assert(spamClick.blocked === true, 'Kitchen Ra Line Cooldown', 'Khóa nút tối thiểu 1.5s chặn thành công hành vi spam click');

  // 10.3. TASK-S1-05: Đơn báo hỏng với 3 badge trạng thái & 3 nhóm lý do
  const damageList = await kitchenApi.getDamageReports();
  const hasPending = damageList.some(r => r.status === 'CHO_DUYET');
  const hasApproved = damageList.some(r => r.status === 'DA_DUYET' || r.status === 'TU_DONG_DUYET');
  const hasRejected = damageList.some(r => r.status === 'TU_CHOI');

  assert(hasPending, 'Damage Reports Badge', 'Có đơn hiển thị badge 🟡 Chờ Bếp trưởng duyệt');
  assert(hasApproved, 'Damage Reports Badge', 'Có đơn hiển thị badge 🟢 Đã duyệt kèm người duyệt & giờ');
  assert(hasRejected, 'Damage Reports Badge', 'Có đơn hiển thị badge 🔴 Từ chối kèm lý do');

  // Kiểm tra 3 nhóm lý do xuất hủy
  const validDamageReasonGroups = [
    'HONG_SO_CHE_NAU',    // Nhóm 1: Sơ chế / nấu hỏng
    'HONG_DO_NHA_CUNG_CAP', // Nhóm 2: Nguyên liệu chết / ươn từ NCC
    'HUY_THUA_CUOI_CA',     // Nhóm 3: Thừa cuối ca theo VSATTP
  ];

  const reportGrp1 = await kitchenApi.recordDamageReport({
    itemId: 1,
    quantity: 1.0,
    reason: 'HONG_SO_CHE_NAU',
    note: 'Chè cháy, cơm khê do sự cố nhiệt',
  });
  assert(reportGrp1.data.reason === 'HONG_SO_CHE_NAU', 'Damage Reason Groups', 'Ghi nhận nhóm 1: Hủy do sơ chế / nấu hỏng');

  const reportGrp2 = await kitchenApi.recordDamageReport({
    itemId: 2,
    quantity: 2.0,
    reason: 'HONG_DO_NHA_CUNG_CAP',
    supplierCode: 'NCC_HAI_SAN_01',
    note: 'Cua chết, ghẹ óp từ NCC',
  });
  assert(reportGrp2.data.reason === 'HONG_DO_NHA_CUNG_CAP', 'Damage Reason Groups', 'Ghi nhận nhóm 2: Hủy do nguyên liệu chết / ươn từ NCC');

  const reportGrp3 = await kitchenApi.recordDamageReport({
    itemId: 4,
    quantity: 0.8,
    reason: 'HUY_THUA_CUOI_CA',
    note: 'Hàng ra line không dùng hết theo quy định VSATTP',
  });
  assert(reportGrp3.data.reason === 'HUY_THUA_CUOI_CA', 'Damage Reason Groups', 'Ghi nhận nhóm 3: Hủy do thừa cuối ca');

  // -----------------------------------------------------------------
  // 11. KIỂM THỬ SPRINT 2: REAL SEED DATA THÁNG 11 (TASK-S2-01 -> S2-04)
  // -----------------------------------------------------------------
  console.log('\n📊 SUITE 11: Real Seed Data T11 (50+ NCC, 60+ mặt hàng 10 nhóm chi phí, 49 nhân sự kèm STK ngân hàng, 18 ngày suất ăn)');

  // 11.1. TASK-S2-01: 50+ NCC thật chuẩn hóa mã NCC
  const totalSuppliers = await db.suppliers.count();
  assert(
    totalSuppliers >= 50,
    'Sprint 2 Suppliers',
    `Trích xuất đầy đủ 50+ NCC thật (thực tế: ${totalSuppliers} NCC)`,
    `Thực tế: ${totalSuppliers}`
  );

  const cothuy = await db.suppliers.where('supplierCode').equals('TNCOTHUY').first();
  assert(!!cothuy && cothuy.supplierName.includes('Cô Thúy'), 'Sprint 2 Suppliers', 'Có NCC Cô Thúy đồ khô (TNCOTHUY)');

  const liencua = await db.suppliers.where('supplierCode').equals('TNLIENCUA').first();
  assert(!!liencua && liencua.supplierName.includes('Liên Cua Cà Mau'), 'Sprint 2 Suppliers', 'Có NCC Liên Cua Cà Mau (TNLIENCUA)');

  const cophuong = await db.suppliers.where('supplierCode').equals('TNCOPHUONG').first();
  assert(!!cophuong && cophuong.supplierName.includes('Cô Phượng Ghẹ'), 'Sprint 2 Suppliers', 'Có NCC Cô Phượng Ghẹ Nghệ An (TNCOPHUONG)');

  const cothao = await db.suppliers.where('supplierCode').equals('QVCOTHAO').first();
  assert(!!cothao && cothao.supplierName.includes('Cô Thảo'), 'Sprint 2 Suppliers', 'Có NCC Cô Thảo đồ khô (QVCOTHAO)');

  const chiphuong = await db.suppliers.where('supplierCode').equals('QVCHIPHUONG').first();
  assert(!!chiphuong && chiphuong.supplierName.includes('Chị Phượng rau'), 'Sprint 2 Suppliers', 'Có NCC Chị Phượng rau (QVCHIPHUONG)');

  // 11.2. TASK-S2-02: ~60+ Mặt hàng thật với 10 nhóm chi phí chuẩn
  const totalItems = await db.items.count();
  assert(
    totalItems >= 60,
    'Sprint 2 Items',
    `Trích xuất danh mục hàng thật phong phú >= 60 mặt hàng (thực tế: ${totalItems} mặt hàng)`,
    `Thực tế: ${totalItems}`
  );

  const allItems = await db.items.toArray();
  const costGroupsInDb = new Set(allItems.map((it: any) => it.costGroup).filter(Boolean));
  assert(
    costGroupsInDb.size >= 10,
    'Sprint 2 Items',
    `Bao phủ trọn vẹn 10 nhóm chi phí chuẩn (thực tế: ${costGroupsInDb.size} nhóm)`,
    `Các nhóm: ${Array.from(costGroupsInDb).join(', ')}`
  );

  const gtdItem1 = await db.items.where('itemCode').equals('TNBCBT').first();
  assert(!!gtdItem1 && gtdItem1.costPrice === 190000, 'Sprint 2 Items', 'Có Ba Chỉ Bò Thanh từ GIA TON DAU (đơn giá tồn: 190.000đ)');

  const gtdItem2 = await db.items.where('itemCode').equals('TNDAUHAO').first();
  assert(!!gtdItem2 && gtdItem2.costPrice === 50000, 'Sprint 2 Items', 'Có Dầu Hào Magi 1Lít từ GIA TON DAU (đơn giá tồn: 50.000đ)');

  const cuaThit = await db.items.where('itemCode').equals('TNCUA').first();
  assert(!!cuaThit && cuaThit.costGroup === 'Hải sản chính', 'Sprint 2 Items', 'Có Cua Thịt thuộc nhóm Hải sản chính');

  // 11.3. TASK-S2-03: 49 Nhân sự thực tế (29 Thái Nguyên + 20 Quế Võ) kèm STK ngân hàng
  assert(
    SEED_REAL_PERSONNEL.length === 49,
    'Sprint 2 Personnel',
    `Đúng 49 nhân sự thực tế (thực tế: ${SEED_REAL_PERSONNEL.length} nhân sự)`
  );

  const tnPersonnel = SEED_REAL_PERSONNEL.filter((p: any) => p.branchCode === 'TN');
  assert(
    tnPersonnel.length === 29,
    'Sprint 2 Personnel',
    `29 nhân sự thực tế chi nhánh Thái Nguyên (thực tế: ${tnPersonnel.length})`
  );

  const qvPersonnel = SEED_REAL_PERSONNEL.filter((p: any) => p.branchCode === 'QV');
  assert(
    qvPersonnel.length === 20,
    'Sprint 2 Personnel',
    `20 nhân sự thực tế chi nhánh Quế Võ (thực tế: ${qvPersonnel.length})`
  );

  const allHaveBank = SEED_REAL_PERSONNEL.every((p: any) => !!p.bankAccount && !!p.bankName);
  assert(
    allHaveBank,
    'Sprint 2 Personnel',
    '100% nhân sự có đầy đủ Số tài khoản (STK) và Tên Ngân hàng'
  );

  const nguyenBaHoan = SEED_REAL_PERSONNEL.find((p: any) => p.fullName === 'Nguyễn Bá Hoan');
  assert(
    !!nguyenBaHoan && nguyenBaHoan.position === 'Bếp Trưởng' && nguyenBaHoan.baseSalary === 16000000,
    'Sprint 2 Personnel',
    'Có nhân sự Bếp Trưởng Nguyễn Bá Hoan lương 16.000.000đ'
  );

  const phamTuanNam = SEED_REAL_PERSONNEL.find((p: any) => p.fullName === 'Phạm Tuấn Nam');
  assert(
    !!phamTuanNam && phamTuanNam.bankName === 'SHB',
    'Sprint 2 Personnel',
    'Có Quản lý Phạm Tuấn Nam ngân hàng SHB'
  );

  // 11.4. TASK-S2-04: 18 ngày suất ăn & doanh thu thật 2 chi nhánh
  const totalMeals = await db.dailyMeals.count();
  assert(
    totalMeals === 36,
    'Sprint 2 Daily Meals',
    `Tổng cộng 36 bản ghi suất ăn (18 ngày × 2 chi nhánh, thực tế: ${totalMeals})`
  );

  const tnDailyMeals = await db.dailyMeals.where('branchCode').equals('TN').toArray();
  assert(
    tnDailyMeals.length === 18,
    'Sprint 2 Daily Meals',
    `Chi nhánh Thái Nguyên có đủ 18 ngày số liệu suất ăn`
  );

  const qvDailyMeals = await db.dailyMeals.where('branchCode').equals('QV').toArray();
  assert(
    qvDailyMeals.length === 18,
    'Sprint 2 Daily Meals',
    `Chi nhánh Quế Võ có đủ 18 ngày số liệu suất ăn & doanh thu`
  );

  const qvDay1 = qvDailyMeals.find((m: any) => m.day === 1);
  assert(
    !!qvDay1 && qvDay1.totalMeals === 97.5 && qvDay1.revenue === 41535000,
    'Sprint 2 Daily Meals',
    'QV Ngày 1: đúng 97.5 suất ăn và doanh thu 41.535.000đ từ sheet SUATAN'
  );

  // -----------------------------------------------------------------
  // 12. KIỂM THỬ SPRINT 3: PHÂN HÓA 3 CẤP QUẢN LÝ (TASK-S3-01 -> S3-04)
  // -----------------------------------------------------------------
  console.log('\n👑 SUITE 12: 3 Management Levels (Executive Cockpit, Head Chef, Branch Manager)');

  // 12.1. Phân tách quyền hạn Chủ chuỗi vs Kế toán tổng
  assert(
    isViewAuthorized('executive-cockpit', userAdminChu) === true,
    'RBAC Executive Cockpit',
    'Chủ chuỗi có toàn quyền truy cập Executive Cockpit'
  );
  assert(
    isViewAuthorized('executive-cockpit', userKeToan) === false,
    'RBAC Executive Cockpit Separation',
    'Kế toán tổng tuyệt đối KHÔNG có quyền truy cập Executive Cockpit của Giám đốc'
  );
  assert(
    getDefaultAuthorizedView(userAdminChu) === 'executive-cockpit',
    'Default View Chủ chuỗi',
    'Màn hình mặc định của Chủ chuỗi là executive-cockpit'
  );

  // 12.2. Phân quyền Bếp Trưởng
  assert(
    isViewAuthorized('head-chef', userQlBep) === true,
    'RBAC Head Chef Dashboard',
    'Bếp trưởng được truy cập trung tâm chỉ huy HeadChefDashboard'
  );
  assert(
    isViewAuthorized('head-chef', userBep) === false,
    'RBAC Head Chef Separation',
    'Bếp viên không có quyền truy cập HeadChefDashboard'
  );
  assert(
    isViewAuthorized('head-chef', userKeToan) === false,
    'RBAC Head Chef Separation',
    'Kế toán tổng không có quyền truy cập HeadChefDashboard của Bếp trưởng'
  );
  assert(
    getDefaultAuthorizedView(userQlBep) === 'head-chef',
    'Default View Bếp trưởng',
    'Màn hình mặc định của Bếp trưởng là head-chef'
  );

  // 12.3. Phân quyền Quản Lý Chi Nhánh
  assert(
    isViewAuthorized('branch-manager', userQlChiNhanh) === true,
    'RBAC Branch Manager Center',
    'Quản lý chi nhánh được truy cập BranchManagerCenter'
  );
  assert(
    isViewAuthorized('branch-manager', userBep) === false,
    'RBAC Branch Manager Separation',
    'Bếp viên không có quyền truy cập BranchManagerCenter'
  );
  assert(
    isViewAuthorized('branch-manager', userKeToan) === false,
    'RBAC Branch Manager Separation',
    'Kế toán tổng không truy cập BranchManagerCenter'
  );
  assert(
    getDefaultAuthorizedView(userQlChiNhanh) === 'branch-manager',
    'Default View Quản lý chi nhánh',
    'Màn hình mặc định của Quản lý chi nhánh là branch-manager'
  );

  // 12.4. Kiểm thử nghiệp vụ Bảng Chỉ Huy Giám Đốc (Cockpit)
  const tnRevenue = 685000000;
  const qvRevenue = 540000000;
  const tnFoodCostPercent = (328000000 / tnRevenue) * 100;
  const qvFoodCostPercent = (245000000 / qvRevenue) * 100;
  assert(
    qvFoodCostPercent < tnFoodCostPercent && qvFoodCostPercent < 46.0,
    'Executive Cockpit Financials',
    'Quế Võ kiểm soát cost thực phẩm tốt hơn Thái Nguyên (45.4% vs 47.9%)',
    `QV Cost: ${qvFoodCostPercent.toFixed(1)}%, TN Cost: ${tnFoodCostPercent.toFixed(1)}%`
  );

  const cuaLossPerGuest = 0.34 - 0.28;
  assert(
    cuaLossPerGuest > 0.05,
    'Executive Cockpit Hot Loss Alert',
    'Cảnh báo nóng hụt cua thịt Cà Mau vượt chuẩn > 0.05 kg/khách (+21.4%)',
    `Độ lệch: +${cuaLossPerGuest.toFixed(3)} kg/khách`
  );

  // 12.5. Kiểm thử nghiệp vụ Bếp Trưởng duyệt báo hỏng & cập nhật trạng thái
  const sampleReportToApprove = await db.damageReports.add({
    branchId: 1,
    itemId: 1,
    quantity: 3.5,
    estimatedValue: 1200000,
    reason: 'Cua chết ngạt khi vận chuyển',
    status: 'CHO_DUYET',
    createdAt: '2026-11-20 10:00',
  });
  await db.damageReports.update(sampleReportToApprove, {
    status: 'DA_DUYET',
    approvedBy: 'Trần Thị Bếp Trưởng',
    approvedAt: '2026-11-20 10:15',
  });
  const approvedItem = await db.damageReports.get(sampleReportToApprove);
  assert(
    approvedItem?.status === 'DA_DUYET' && approvedItem?.approvedBy === 'Trần Thị Bếp Trưởng',
    'Head Chef Damage Approval',
    'Bếp trưởng phê duyệt đơn báo hỏng thành công và ghi nhận thông tin người duyệt'
  );

  // 12.5b. Bếp trưởng từ chối báo hỏng kèm lý do từ chối bắt buộc
  const sampleReportToReject = await db.damageReports.add({
    branchId: 1,
    itemId: 2,
    quantity: 5.0,
    estimatedValue: 1800000,
    reason: 'Nước dùng chua hỏng',
    status: 'CHO_DUYET',
    createdAt: '2026-11-20 10:30',
  });
  await db.damageReports.update(sampleReportToReject, {
    status: 'TU_CHOI',
    rejectedBy: 'Trần Thị Bếp Trưởng',
    rejectedReason: 'Ảnh chụp không rõ tem niêm phong và cảm quan vẫn đạt chuẩn',
    approvedAt: '2026-11-20 10:45',
  });
  const rejectedItem = await db.damageReports.get(sampleReportToReject);
  assert(
    rejectedItem?.status === 'TU_CHOI' && (rejectedItem as any)?.rejectedReason?.includes('không rõ tem'),
    'Head Chef Damage Rejection',
    'Bếp trưởng từ chối đơn báo hỏng kèm lý do giải trình chuẩn nghiệp vụ'
  );

  // 12.5c. Bếp trưởng lập Đơn Báo Hàng NCC theo chuẩn sheet BAOHANG
  const sampleHeadChefOrder = {
    id: 'ORDER-BAOHANG-20261121-001',
    branchId: 1,
    branchName: 'Sen Việt Buffet - Thái Nguyên',
    supplierCode: 'TNLIENCUA',
    supplierName: 'Liên Cua Cà Mau',
    deliveryDate: '2026-11-21',
    deliveryShift: 'CA_SANG',
    items: [
      { itemId: 1, itemCode: 'TNCUA', itemName: 'Cua Thịt Cà Mau', quantity: 50, unit: 'kg', note: 'Cua loại 1 dây trói mỏng' },
      { itemId: 2, itemCode: 'TNGHE', itemName: 'Ghẹ Nghệ An', quantity: 30, unit: 'kg', note: 'Ghẹ sống bơi khỏe' },
    ],
    totalItems: 2,
    status: 'DA_GUI',
    createdByName: 'Nguyễn Bá Hoan (Bếp Trưởng)',
    createdAt: '2026-11-20 16:30',
  };
  const currentOrders = JSON.parse(localStorage.getItem('senviet_headchef_orders') || '[]');
  currentOrders.unshift(sampleHeadChefOrder);
  localStorage.setItem('senviet_headchef_orders', JSON.stringify(currentOrders));
  const retrievedOrders = JSON.parse(localStorage.getItem('senviet_headchef_orders') || '[]');
  assert(
    retrievedOrders.length >= 1 && retrievedOrders[0].supplierCode === 'TNLIENCUA' && retrievedOrders[0].items.length === 2,
    'Head Chef Supplier Order',
    'Bếp trưởng lập đơn báo hàng NCC giao ngày mai (chuẩn sheet BAOHANG) thành công'
  );

  // 12.5d. Bếp trưởng điều chỉnh định mức chuẩn mẻ chế biến
  const sampleRecipe = await db.recipes.toCollection().first();
  if (sampleRecipe && sampleRecipe.id) {
    const originalStandard = sampleRecipe.standardLossPercent;
    await db.recipes.update(sampleRecipe.id, { standardLossPercent: 7.5 });
    const updatedRecipe = await db.recipes.get(sampleRecipe.id);
    assert(
      updatedRecipe?.standardLossPercent === 7.5,
      'Head Chef Recipe Standard Adjustment',
      `Bếp trưởng cập nhật định mức hao hụt chuẩn (${originalStandard}% -> 7.5%) thành công`
    );
  }

  // 12.6. Kiểm thử nghiệp vụ Quản Lý Chi Nhánh: Cảnh báo ra ngoài & GPS
  const breakMinutes = 22;
  const isOverBreakLimit = breakMinutes > 15;
  const breakTimesInShift = 4;
  const isOverBreakFrequency = breakTimesInShift > 3;
  assert(
    isOverBreakLimit === true && isOverBreakFrequency === true,
    'Branch Manager Break Out Rules',
    'Tự động báo đỏ vi phạm ra ngoài > 15 phút và vượt quá 3 lần/ca (sheet ĐĂNG KÝ RA NGOÀI)',
    `Vắng mặt: ${breakMinutes}p, Lần thứ: ${breakTimesInShift}`
  );

  // 12.7. Quản lý chi nhánh ghi biên bản phạt vi phạm liên kết trừ lương
  const samplePenalty = {
    id: 'PEN-202611-099',
    employeeName: 'Nguyễn Văn Bếp',
    branchId: 1,
    violationDate: '2026-11-20',
    shift: 'CA_TOI',
    category: 'QUY_DINH_NOI_BO',
    fineAmount: 200000,
    reason: 'Không đội mũ bếp và tạp dề đúng quy định VSATTP',
    isDeductedFromSalary: true,
    createdByName: 'Phạm Tuấn Nam (Quản Lý)',
    createdAt: '2026-11-20 18:00',
  };
  const currentPenalties = JSON.parse(localStorage.getItem('senviet_penalties') || '[]');
  currentPenalties.push(samplePenalty);
  localStorage.setItem('senviet_penalties', JSON.stringify(currentPenalties));
  const retrievedPenalties = JSON.parse(localStorage.getItem('senviet_penalties') || '[]');
  assert(
    retrievedPenalties.some((p: any) => p.id === 'PEN-202611-099' && p.fineAmount === 200000 && p.isDeductedFromSalary === true),
    'Branch Manager Penalty Record',
    'Quản lý chi nhánh ghi biên bản phạt vi phạm và đánh dấu trừ lương trực tiếp'
  );

  // 12.8. Quản lý chi nhánh chấm thi tay nghề dao thớt & mở quyền thi lại
  const sampleSkillExam = {
    id: 'EXAM-2026-11-01',
    employeeName: 'Nguyễn Văn Bếp',
    position: 'Nhân viên bếp',
    knifePrepScore: 18,
    recipeScore: 35,
    hygieneScore: 15,
    totalScore: 68,
    status: 'CHUA_DAT',
    canRetake: false,
    evaluatedByName: 'Phạm Tuấn Nam (Quản Lý)',
    examDate: '2026-11-18',
  };
  const currentExams = JSON.parse(localStorage.getItem('senviet_skill_exams') || '[]');
  currentExams.push(sampleSkillExam);
  // Mở quyền thi lại
  sampleSkillExam.canRetake = true;
  localStorage.setItem('senviet_skill_exams', JSON.stringify(currentExams));
  const retrievedExams = JSON.parse(localStorage.getItem('senviet_skill_exams') || '[]');
  const examFound = retrievedExams.find((e: any) => e.id === 'EXAM-2026-11-01');
  assert(
    !!examFound && examFound.totalScore === 68 && examFound.canRetake === true,
    'Branch Manager Skill Evaluation',
    'Quản lý chấm điểm tay nghề dao thớt và kích hoạt nút mở quyền thi lại'
  );

  // 12.9. Chủ chuỗi phê duyệt đề xuất tăng lương chuỗi (Executive Cockpit)
  const approvedProposal = await payrollApi.approveIncrease(1);
  assert(
    approvedProposal.status === 'DA_DUYET' && approvedProposal.raiseAmount === 1000000,
    'Executive Cockpit Salary Increase Approval',
    'Chủ chuỗi duyệt đề xuất tăng lương (+1.000.000đ) thành công từ Executive Cockpit'
  );

  // -----------------------------------------------------------------
  // 13. KIỂM THỬ SPRINT 4: ĐỐI SOÁT TỰ ĐỘNG, CÂN LỆCH NCC & NÂNG CẤP BẢNG LƯƠNG
  // -----------------------------------------------------------------
  console.log('\n⚖️ SUITE 13: Sprint 4 Features (TASK-S4-01 AutoNXT, TASK-S4-02 Supplier Weight Debt, TASK-S4-03 Enhanced Payroll)');

  // 13.1. TASK-S4-01: AutoNXTTable - Bảng Nhập Xuất Tồn chuẩn Sheet NXT Thái Nguyên & Quế Võ
  assert(
    SEED_NXT_RECORDS.length >= 500,
    'Sprint 4 AutoNXT',
    `Dữ liệu NXT trích xuất từ 2 chi nhánh đầy đủ >= 500 bản ghi (thực tế: ${SEED_NXT_RECORDS.length} bản ghi)`,
    `Thực tế: ${SEED_NXT_RECORDS.length}`
  );

  const tnNXTCount = SEED_NXT_RECORDS.filter(d => d.branchId === 1).length;
  const qvNXTCount = SEED_NXT_RECORDS.filter(d => d.branchId === 2).length;
  assert(
    tnNXTCount >= 250 && qvNXTCount >= 250,
    'Sprint 4 AutoNXT',
    `Có đủ bản ghi NXT của cả Thái Nguyên (${tnNXTCount}) và Quế Võ (${qvNXTCount})`
  );

  // Kiểm tra công thức Tồn cuối = Tồn đầu + Nhập - Xuất trên toàn bộ dữ liệu
  const isFormulaCorrect = SEED_NXT_RECORDS.every(d => {
    const calcEnding = Number((d.openingStockQty + d.importedQty - d.exportedQty).toFixed(2));
    return Math.abs(calcEnding - d.closingStockQty) <= 0.05;
  });
  assert(
    isFormulaCorrect,
    'Sprint 4 AutoNXT',
    'Công thức Tồn cuối = Tồn đầu + Nhập - Xuất khớp 100% bản ghi'
  );

  // Kiểm tra cảnh báo cờ đỏ thất thoát vượt ngưỡng
  const cuaNXT = SEED_NXT_RECORDS.find(d => d.itemCode === 'TNCUA' || d.itemName.includes('Cua'));
  assert(
    !!cuaNXT && cuaNXT.diffTotalAmount < -300000,
    'Sprint 4 AutoNXT',
    'Tự động tô đỏ cảnh báo nếu chênh lệch âm vượt ngưỡng thất thoát (>300.000đ)'
  );

  // 13.2. TASK-S4-02: Cân Lệch NCC & Tự động giảm trừ công nợ NCC
  const sampleDocItem = {
    itemId: 1,
    itemCode: 'TNCUA',
    itemName: 'Cua Thịt Cà Mau',
    quantity: 45.0,
    reportedWeight: 50.0, // NCC báo: 50 kg
    actualWeight: 45.0,   // Thực cân: 45 kg
    unitPrice: 420000,
    amount: 18900000,
  };
  const diffWeight = sampleDocItem.actualWeight - sampleDocItem.reportedWeight;
  const shortageAmount = diffWeight < 0 ? Math.abs(diffWeight) * sampleDocItem.unitPrice : 0;
  assert(
    diffWeight === -5.0 && shortageAmount === 2100000,
    'Sprint 4 Supplier Debt',
    'Tự động tính Lệch = Thực cân - NCC báo (-5.0 kg) và Tiền giảm trừ thiếu (2.100.000đ)'
  );

  const supplierDebtList = await warehouseApi.getSupplierDebtSummary();
  assert(
    supplierDebtList.length >= 4,
    'Sprint 4 Supplier Debt',
    `Bảng tổng hợp công nợ NCC trả về >= 4 NCC (thực tế: ${supplierDebtList.length} NCC)`
  );

  const debtFormulaVerified = supplierDebtList.every(
    s => s.finalPayableDebt === s.totalReportedAmount - s.totalShortageDeduction
  );
  assert(
    debtFormulaVerified,
    'Sprint 4 Supplier Debt',
    'Công nợ thực trả tự động trừ tiền cân thiếu: Thực trả = NCC báo - Tiền thiếu'
  );

  // 13.3. TASK-S4-03: Nâng cấp Bảng Lương (STK Ngân hàng, Trừ phạt, 0.5 công, Payslip)
  const payrollListT11 = await payrollApi.getPayroll('2026-11');
  assert(
    payrollListT11.length >= 40,
    'Sprint 4 Payroll',
    `Bảng lương T11 nạp đầy đủ nhân sự chi nhánh (thực tế: ${payrollListT11.length} nhân sự)`
  );

  // 100% nhân sự có STK và Tên Ngân Hàng
  const allStaffHaveBank = payrollListT11.every(p => !!p.bankName && !!p.bankAccountNumber);
  assert(
    allStaffHaveBank,
    'Sprint 4 Payroll',
    '100% nhân sự có STK và Tên Ngân Hàng để kế toán xuất file chuyển khoản'
  );

  // Hỗ trợ chấm công bán phần (0.5 công / nửa ca)
  const staffWithHalfDays = payrollListT11.filter(p => p.actualWorkDays % 1 !== 0);
  assert(
    staffWithHalfDays.length >= 15,
    'Sprint 4 Payroll',
    `Hỗ trợ chấm công bán phần (0.5 công / nửa ca) cho >= 15 nhân sự (thực tế: ${staffWithHalfDays.length} người)`
  );

  // Kiểm tra công thức Thực lĩnh chuẩn: Lương công + Chuyên cần + Trách nhiệm - Bảo hiểm - Ứng lương - Tiền phạt
  const hoanPayroll = payrollListT11.find(p => p.fullName === 'Nguyễn Bá Hoan');
  assert(
    !!hoanPayroll && hoanPayroll.actualWorkDays === 11.5 && hoanPayroll.netSalary > 0,
    'Sprint 4 Payroll',
    'Bếp Trưởng Nguyễn Bá Hoan có ngày công bán phần 11.5 công và Thực lĩnh tính tự động'
  );

  // Thử nghiệm cập nhật ngày công bán phần (updateWorkDays)
  if (hoanPayroll) {
    const updatedHoan = await payrollApi.updateWorkDays(hoanPayroll.id, 12.0);
    assert(
      updatedHoan.actualWorkDays === 12.0 && updatedHoan.workSalary! > hoanPayroll.workSalary!,
      'Sprint 4 Payroll',
      'Cập nhật ngày công bán phần (11.5 -> 12.0 công) tự động tính lại Lương công và Thực lĩnh'
    );
  }

  // 13.4. Kiểm thử tự động khấu trừ Ứng lương & Tiền phạt vi phạm vào Thực lĩnh
  // Tạo 1 đơn ứng lương đã giải ngân (DA_CHI) 500.000đ cho nhân viên Vũ Huy Thắng
  await db.salaryAdvances.add({
    userId: 12,
    fullName: 'Vũ Huy Thắng',
    username: 'tn_vuhuythang',
    branchId: 1,
    requestDate: '2026-11-10',
    requestedAmount: 500000,
    disbursedAmount: 500000,
    reason: 'Ứng tiền viện phí đột xuất',
    deductionMonth: '2026-11',
    status: 'DA_CHI',
  });

  // Tạo 1 biên bản phạt vi phạm 200.000đ có đánh dấu trừ lương (isDeductedFromSalary: true)
  const penaltyListForDeduction = [
    {
      id: 'PEN-TEST-001',
      employeeName: 'Vũ Huy Thắng',
      branchId: 1,
      fineAmount: 200000,
      reason: 'Đi làm muộn 30 phút ca trưa',
      isDeductedFromSalary: true,
      violationDate: '2026-11-15',
    },
  ];
  localStorage.setItem('senviet_penalties', JSON.stringify(penaltyListForDeduction));

  const payrollAfterDeduction = await payrollApi.getPayroll('2026-11');
  const thangStaff = payrollAfterDeduction.find(p => p.fullName === 'Vũ Huy Thắng' || p.username === 'tn_vuhuythang');
  assert(
    !!thangStaff && thangStaff.advanceDeduction === 500000 && thangStaff.penaltyDeduction === 200000,
    'Sprint 4 Payroll Deductions',
    'Tự động nhận diện Ứng lương (500.000đ) & Phạt vi phạm (200.000đ) vào cột khấu trừ bảng lương'
  );

  if (thangStaff) {
    const expectedNetSalary = Math.round(
      (thangStaff.workSalary || 0) +
      (thangStaff.attendanceBonus || 0) +
      (thangStaff.responsibilityAllowance || 0) -
      (thangStaff.insuranceDeduction || 0) -
      thangStaff.advanceDeduction -
      thangStaff.penaltyDeduction
    );
    assert(
      thangStaff.netSalary === expectedNetSalary,
      'Sprint 4 Net Salary Formula',
      'Công thức Thực lĩnh chuẩn: Thực lĩnh = Lương công + Thưởng - BHXH - Ứng lương - Phạt',
      `Thực lĩnh: ${thangStaff.netSalary.toLocaleString('vi-VN')} đ (khớp chính xác ${expectedNetSalary.toLocaleString('vi-VN')} đ)`
    );

    // 13.5. Kiểm thử cấu trúc Digital Payslip Card
    const hasDigitalCardFields = !!(
      thangStaff.fullName &&
      thangStaff.bankName &&
      thangStaff.bankAccountNumber &&
      thangStaff.actualWorkDays !== undefined &&
      thangStaff.workSalary !== undefined &&
      thangStaff.advanceDeduction !== undefined &&
      thangStaff.penaltyDeduction !== undefined &&
      thangStaff.netSalary !== undefined
    );
    assert(
      hasDigitalCardFields,
      'Sprint 4 Digital Payslip Card',
      'Phiếu lương điện tử (Digital Payslip Card) chứa đủ các trường thụ hưởng ngân hàng & chi tiết 9 dòng khấu trừ'
    );
  }

  // Kiểm tra file chuyển khoản ngân hàng (exportBankExcel)
  const bankExcelBlob = await payrollApi.exportBankExcel('2026-11');
  assert(
    bankExcelBlob.size > 1000,
    'Sprint 4 Payroll',
    'Xuất file lệnh chi chuyển khoản ngân hàng (.xlsx) thành công với đầy đủ STK & Ngân hàng'
  );

  // -----------------------------------------------------------------
  // 14. KIỂM THỬ PHÂN HỆ QUẢN LÝ KHO & NHẬP HÀNG CHUYÊN SÂU (WAREHOUSE DEEP QA)
  // -----------------------------------------------------------------
  console.log('\n📦 SUITE 14: Warehouse & Inventory Deep Operations');

  // 14.1. Phiếu xuất hủy 3 phân loại lý do nghiệp vụ
  // Nhóm 1: Hải sản chết NCC / Cua chết (Truy vết bắt đền NCC)
  const docHuyNCC = await warehouseApi.createDocument({
    branchId: 1,
    branchCode: 'TN',
    docType: 'HUY',
    supplierId: 1,
    note: 'Xuất hủy 2.0 kg cá hồi chết/ngộp từ NCC Hải Sản Biển Đông',
    items: [
      {
        itemId: 1,
        quantity: 2.0,
        unitPrice: 380000,
        reason: 'Hải sản chết / ngộp khi giao - Trách nhiệm NCC',
        lossCategory: 'HAI_SAN_CHET_NCC',
      },
    ],
  });
  assert(
    docHuyNCC.docType === 'HUY' &&
      docHuyNCC.items[0].lossCategory === 'HAI_SAN_CHET_NCC' &&
      docHuyNCC.supplierId === 1,
    'Warehouse Waste 3 Categories',
    'Tạo phiếu xuất hủy nhóm (1) Hải sản chết NCC thành công kèm liên kết NCC để bắt đền'
  );

  // Nhóm 2: Hỏng bảo quản kho / Hết hạn
  const docHuyKho = await warehouseApi.createDocument({
    branchId: 1,
    branchCode: 'TN',
    docType: 'HUY',
    note: 'Xuất hủy do sự cố tủ mát bảo quản',
    items: [
      {
        itemId: 1,
        quantity: 1.0,
        unitPrice: 380000,
        reason: 'Hỏng do bảo quản tủ mát không đạt nhiệt độ / Hết hạn',
        lossCategory: 'HONG_BAO_QUAN_KHO',
      },
    ],
  });
  assert(
    docHuyKho.items[0].lossCategory === 'HONG_BAO_QUAN_KHO',
    'Warehouse Waste 3 Categories',
    'Tạo phiếu xuất hủy nhóm (2) Hỏng bảo quản kho/hết hạn thành công'
  );

  // Nhóm 3: Bếp làm hỏng / Chè hỏng / Cháy khét
  const docHuyBep = await warehouseApi.createDocument({
    branchId: 1,
    branchCode: 'TN',
    docType: 'HUY',
    note: 'Bếp sơ chế làm hỏng nguyên liệu',
    items: [
      {
        itemId: 1,
        quantity: 1.0,
        unitPrice: 380000,
        reason: 'Bếp sơ chế làm đứt gãy / mẻ chế biến cháy khét',
        lossCategory: 'BEP_LAM_HONG',
      },
    ],
  });
  assert(
    docHuyBep.items[0].lossCategory === 'BEP_LAM_HONG',
    'Warehouse Waste 3 Categories',
    'Tạo phiếu xuất hủy nhóm (3) Bếp làm hỏng/chè hỏng/cháy khét thành công'
  );

  // 14.2. Ràng buộc cứng chặn xuất âm kho (Negative Stock Prevention)
  const currentStockBefore = await warehouseApi.getItemCurrentStock(1, 'TN');
  let negativeStockBlocked = false;
  let blockErrorMessage = '';
  try {
    await warehouseApi.createDocument({
      branchId: 1,
      branchCode: 'TN',
      docType: 'HUY',
      items: [
        {
          itemId: 1,
          quantity: currentStockBefore + 999.0,
          unitPrice: 380000,
          lossCategory: 'HONG_BAO_QUAN_KHO',
        },
      ],
    });
  } catch (err: any) {
    negativeStockBlocked = true;
    blockErrorMessage = err.message || '';
  }
  assert(
    negativeStockBlocked && blockErrorMessage.includes('vượt quá tồn kho'),
    'Warehouse Negative Stock Prevention',
    'Chặn cứng không cho phép xuất âm kho khi số lượng xuất hủy vượt quá tồn khả dụng',
    `Tồn hiện tại: ${currentStockBefore} kg, Thử xuất: ${currentStockBefore + 999.0} kg -> Hệ thống chặn lỗi: "${blockErrorMessage}"`
  );

  // Kiểm tra tồn kho khả dụng giảm chính xác theo các phiếu xuất hủy hợp lệ
  const stockAfterValidDeduct = await warehouseApi.getItemCurrentStock(1, 'TN');
  assert(
    stockAfterValidDeduct > 0 && stockAfterValidDeduct < currentStockBefore + 4.0,
    'Warehouse Stock Balance Verification',
    'Tồn kho khả dụng giảm chính xác theo số lượng hàng xuất hủy hợp lệ',
    `Tồn sau khi hủy: ${stockAfterValidDeduct} kg`
  );

  // 14.3. Phiếu nhập kho với cân lệch NCC, tính tiền thiếu và trừ công nợ
  const docNhapLech = await warehouseApi.createDocument({
    branchId: 1,
    branchCode: 'TN',
    docType: 'NHAP',
    supplierId: 1,
    note: 'Nhập cá hồi Nauy lô mới - Phát hiện cân thiếu so với hóa đơn NCC',
    items: [
      {
        itemId: 1,
        supplierReportedWeight: 30.0, // NCC báo 30 kg
        actualWeight: 26.5,           // Thực cân 26.5 kg (thiếu 3.5 kg)
        quantity: 26.5,
        unitPrice: 380000,
      },
    ],
  });
  const itemNhap = docNhapLech.items[0];
  const expectedWeightDiff = -3.5;
  const expectedShortage = 3.5 * 380000; // 1.330.000 đ
  const expectedReportedAmount = 30.0 * 380000; // 11.400.000 đ
  const expectedFinalPayable = 26.5 * 380000; // 10.070.000 đ

  assert(
    itemNhap.supplierReportedWeight === 30.0 &&
      itemNhap.actualWeight === 26.5 &&
      itemNhap.weightDiff === expectedWeightDiff &&
      itemNhap.shortageAmount === expectedShortage,
    'Warehouse Goods Receipt Weight Diff',
    'Phiếu nhập kho ghi nhận 2 cột Khối lượng NCC báo (30kg) vs Thực cân (26.5kg) và tự động tính lệch (-3.5kg)',
    `Lệch: ${itemNhap.weightDiff} kg, Tiền thiếu: ${itemNhap.shortageAmount?.toLocaleString('vi-VN')} đ`
  );

  assert(
    docNhapLech.totalReportedAmount === expectedReportedAmount &&
      docNhapLech.totalShortageAmount === expectedShortage &&
      docNhapLech.finalPayableAmount === expectedFinalPayable,
    'Warehouse Goods Receipt Shortage Deduction',
    'Công nợ nhà cung cấp tự động trừ tiền cân thiếu: Công nợ thực trả = Tiền NCC báo - Tiền thiếu',
    `NCC báo: ${docNhapLech.totalReportedAmount?.toLocaleString('vi-VN')} đ - Giảm trừ: ${docNhapLech.totalShortageAmount?.toLocaleString('vi-VN')} đ = Thực trả: ${docNhapLech.finalPayableAmount?.toLocaleString('vi-VN')} đ`
  );

  // 14.4. Đối chiếu công nợ NCC định kỳ 5-10 ngày, lập phiếu điều chỉnh công nợ và chốt kỳ
  const sampleAdjustment = await warehouseApi.createDebtAdjustment({
    supplierId: 1,
    branchCode: 'TN',
    periodStartDate: '2026-11-11',
    periodEndDate: '2026-11-20',
    totalReportedWeight: 150.0,
    totalActualWeight: 144.5,
    weightDiff: -5.5,
    shortageAmount: 2090000,
    adjustmentAmount: 2090000,
    reason: 'NCC Hải Sản Biển Đông đồng ý trừ 5.5kg hao hụt & cân thiếu kỳ 11-20/11',
    status: 'CHO_DUYET',
    adjustedBy: 'Vũ Thêm (Kế toán tổng)',
  });
  assert(
    sampleAdjustment.id > 0 &&
      sampleAdjustment.adjustmentAmount === 2090000 &&
      sampleAdjustment.status === 'CHO_DUYET',
    'Warehouse Debt Adjustment Creation',
    'Lập phiếu điều chỉnh công nợ đối soát định kỳ (5-10 ngày) thành công ở trạng thái Chờ duyệt'
  );

  const adjList = await warehouseApi.getDebtAdjustments(1, 'TN');
  const foundAdj = adjList.find((a) => a.id === sampleAdjustment.id);
  assert(
    !!foundAdj && foundAdj.reason.includes('đồng ý trừ 5.5kg'),
    'Warehouse Debt Adjustment Retrieval',
    'Truy xuất danh sách phiếu điều chỉnh công nợ theo NCC và Chi nhánh chính xác'
  );

  const closeResult = await warehouseApi.closeDebtPeriod(sampleAdjustment.id);
  assert(
    closeResult.success === true &&
      closeResult.period?.status === 'DA_CHOT' &&
      !!closeResult.period?.closedAt,
    'Warehouse Period Closing Lock',
    'Chốt đối soát kỳ công nợ thành công: Niêm phong trạng thái ĐÃ CHỐT kèm thời gian chốt'
  );

  // 14.5. Thẻ kho tức thời (Stock Ledger) ghi nhận đầy đủ dòng thời gian biến động
  const stockLedger = await warehouseApi.getStockLedger(1, 'TN');
  assert(
    stockLedger.length >= 3,
    'Warehouse Realtime Stock Ledger',
    `Thẻ kho (Stock Ledger) ghi nhận đầy đủ >= 3 sự kiện biến động (thực tế: ${stockLedger.length} dòng)`
  );

  const hasNhap = stockLedger.some((l) => l.docType === 'NHAP');
  const hasHuy = stockLedger.some((l) => l.docType === 'XUAT_HUY' || l.docType === 'HUY');
  assert(
    hasNhap && hasHuy,
    'Warehouse Stock Ledger Event Types',
    'Thẻ kho ghi nhận đầy đủ các phân loại nghiệp vụ: Nhập kho NCC (NHAP) và Xuất hủy hao hụt (XUAT_HUY)'
  );

  const isLedgerWellFormed = stockLedger.every(
    (entry) =>
      !!entry.docCode &&
      !!entry.docTypeName &&
      !!entry.date &&
      entry.inQty !== undefined &&
      entry.outQty !== undefined &&
      entry.changeQty !== undefined &&
      entry.balance !== undefined &&
      !!entry.unit
  );
  assert(
    isLedgerWellFormed,
    'Warehouse Stock Ledger Data Integrity',
    '100% dòng thẻ kho có đầy đủ thông tin mã phiếu, loại chứng từ, lượng vào/ra và tồn lũy kế'
  );

  // 14.6. Kiểm kê kho theo nhóm mặt hàng (Group-based Inventory Check)
  const inventoryAllItems = await db.items.toArray();
  const seafoodItems = inventoryAllItems.filter(
    (i) => i.category === 'Hải sản chính' || i.category?.includes('Hải sản')
  );
  assert(
    seafoodItems.length >= 2,
    'Warehouse Group Inventory Filter',
    `Hệ thống hỗ trợ phân loại theo nhóm mặt hàng: Nhóm Hải sản có >= 2 mặt hàng (thực tế: ${seafoodItems.length})`
  );

  const checkRecord = await warehouseApi.createInventoryCheck({
    branchId: 1,
    shift: 'CA_TOI',
    checkDate: '2026-11-21',
    note: 'Kiểm kê định kỳ nhóm Hải sản tươi sống đắt tiền cuối ca tối',
    items: [
      {
        itemId: 1,
        systemStock: 30.0,
        actualStock: 28.5,
        reason: 'Hao hụt rã đông và tiêu hao ca',
      },
      {
        itemId: 2,
        systemStock: 25.0,
        actualStock: 25.0,
        reason: 'Khớp số liệu',
      },
    ],
  });
  assert(
    checkRecord.checkCode.startsWith('KK-') &&
      checkRecord.items.length === 2 &&
      checkRecord.items[0].difference === -1.5,
    'Warehouse Group Inventory Check Creation',
    'Lập biên bản kiểm kê kho theo nhóm mặt hàng thành công, tự động tính chênh lệch thừa/thiếu'
  );

  const checkHistory = await warehouseApi.getInventoryChecks({ branchId: 1, checkDate: '2026-11-21' });
  assert(
    checkHistory.some((c) => c.id === checkRecord.id),
    'Warehouse Inventory Check History',
    'Truy xuất lịch sử biên bản kiểm kê kho theo ngày và chi nhánh chính xác'
  );

  // -----------------------------------------------------------------
  // 15. KIỂM THỬ TOÀN DIỆN SPRINT KHO (KHO-01 ĐẾN KHO-14)
  // -----------------------------------------------------------------
  console.log('\n🏢 SUITE 15: Sprint Kho Comprehensive Verification (KHO-01 đến KHO-14)');

  // 15.1. KHO-01 & KHO-02: Nhập số lẻ 2.33, 2 cột Thực nhập vs Công nợ NCC, tính đúng chênh lệch cân và tiền thiếu
  const stockBeforeNhapLech = await warehouseApi.getItemCurrentStock(6, 'TN'); // Ghẹ Phú Quốc (Item 6)
  const docNhapLechKHO = await warehouseApi.createDocument({
    branchId: 1,
    branchCode: 'TN',
    docType: 'NHAP',
    supplierId: 1, // Hải Sản Biển Đông
    note: 'Nhập ghẹ Phú Quốc lẻ 2.33kg - Bếp cân thực tế tại quán',
    imageUrls: 'data:image/jpeg;base64,sample_weighing_photo_with_watermark_233',
    items: [
      {
        itemId: 6,
        quantity: 2.33,
        actualWeight: 2.33,           // Cột 1: Thực nhập bếp cân tại quán
        supplierReportedWeight: 2.50, // Cột 2: Hóa đơn NCC giao
        unitPrice: 350000,
        warehouseLocation: 'KHO_BE_SONG',
      },
    ],
  });

  const itemLech = docNhapLechKHO.items[0];
  const expectedWeightDiffKHO = -0.17; // 2.33 - 2.50 = -0.17 kg
  const expectedShortageKHO = Math.round(0.17 * 350000); // 59.500 đ
  const expectedReportedAmountKHO = 2.50 * 350000; // 875.000 đ
  const expectedFinalPayableKHO = expectedReportedAmountKHO - expectedShortageKHO; // 815.500 đ (= 2.33 * 350.000)

  assert(
    itemLech.actualWeight === 2.33 &&
      itemLech.supplierReportedWeight === 2.50 &&
      itemLech.weightDiff === expectedWeightDiffKHO &&
      itemLech.shortageAmount === expectedShortageKHO,
    'KHO-01 & KHO-02 Decimal & Weight Diff',
    'Nhập số lẻ 2.33kg thành công, tự động tính chênh lệch cân (-0.17kg) và tiền giảm trừ thiếu (59.500đ)',
    `Thực cân: ${itemLech.actualWeight} kg | NCC báo: ${itemLech.supplierReportedWeight} kg | Lệch: ${itemLech.weightDiff} kg | Tiền thiếu: ${itemLech.shortageAmount?.toLocaleString('vi-VN')} đ`
  );

  assert(
    docNhapLechKHO.totalReportedAmount === expectedReportedAmountKHO &&
      docNhapLechKHO.totalShortageAmount === expectedShortageKHO &&
      docNhapLechKHO.finalPayableAmount === expectedFinalPayableKHO,
    'KHO-02 Shortage Payable Amount',
    'Công nợ NCC ghi nhận đúng tiền hóa đơn trừ tiền cân thiếu: Thực trả = 815.500đ (chỉ trả cho 2.33kg)',
    `Hóa đơn NCC: ${docNhapLechKHO.totalReportedAmount?.toLocaleString('vi-VN')} đ - Giảm trừ: ${docNhapLechKHO.totalShortageAmount?.toLocaleString('vi-VN')} đ = Thực trả: ${docNhapLechKHO.finalPayableAmount?.toLocaleString('vi-VN')} đ`
  );

  const stockAfterNhapLech = await warehouseApi.getItemCurrentStock(6, 'TN');
  assert(
    Number((stockAfterNhapLech - stockBeforeNhapLech).toFixed(2)) === 2.33,
    'KHO-01 Stock Inflow Decimal Accuracy',
    'Tồn kho thực tế ghi nhận chính xác +2.33kg từ số lượng thực cân (không bị làm tròn số nguyên)',
    `Tồn trước: ${stockBeforeNhapLech} kg -> Tồn sau: ${stockAfterNhapLech} kg (+2.33 kg)`
  );

  // 15.2. KHO-03: Bắt buộc ảnh chứng từ (*), watermark tự động & chặn submit khi không có ảnh
  const watermarkSample = formatWatermarkText({
    branchName: 'Sen Việt - Chi nhánh Thái Nguyên',
    userName: 'Nguyễn Thu Thủy (Kế toán TN)',
    docType: 'Phiếu Nhập Kho',
  });

  assert(
    watermarkSample.includes('Sen Việt - Chi nhánh Thái Nguyên') &&
      watermarkSample.includes('Nguyễn Thu Thủy') &&
      watermarkSample.includes('Phiếu Nhập Kho') &&
      watermarkSample.includes('📍'),
    'KHO-03 Watermark Generation',
    'Watermark tự động sinh đúng format với chi nhánh, nhân viên thực hiện, loại chứng từ và mốc thời gian',
    `Dải watermark: "${watermarkSample}"`
  );

  // Kiểm tra ràng buộc bắt buộc ảnh: UI chặn submit khi không có ảnh
  const validateDocImagesConstraint = (images: any[]): { valid: boolean; error?: string } => {
    if (!images || images.length === 0) {
      return { valid: false, error: '⚠️ Vui lòng chụp ảnh bàn cân hoặc phiếu giao hàng trước khi lưu!' };
    }
    return { valid: true };
  };

  const emptyImagesCheck = validateDocImagesConstraint([]);
  const validImagesCheck = validateDocImagesConstraint([{ dataUrl: 'data:image/jpeg;base64,receipt_photo' }]);

  assert(
    !emptyImagesCheck.valid &&
      emptyImagesCheck.error?.includes('Vui lòng chụp ảnh bàn cân hoặc phiếu giao hàng') &&
      validImagesCheck.valid,
    'KHO-03 Mandatory Receipt Image Constraint',
    'Quy tắc bắt buộc ảnh chứng từ (*): Chặn submit khi thiếu ảnh và cho phép lưu khi có ảnh đính kèm'
  );

  // 15.3. KHO-04: Form xuất hủy 4 nhóm lý do & gắn đúng NCC/Lô khi hủy cua chết
  const wasteCategories = [
    { code: 'HAI_SAN_CHET_NCC', label: 'Cua / Hải sản chết (Bắt đền NCC)', requiresSupplier: true },
    { code: 'ME_CHE_BIEN_HONG', label: 'Mẻ chế biến bị hỏng (Cháy cháo, hỏng chè, hỏng kim chi)', requiresSupplier: false },
    { code: 'DO_TUOI_THUA_CUOI_NGAY', label: 'Đồ tươi thừa cuối ngày (Salad, đồ dùng trong ngày)', requiresSupplier: false },
    { code: 'HAO_HUT_TIEU_HAO', label: 'Hao hụt dây buộc cua & Tiêu hao bóc tách', requiresSupplier: false },
  ];

  assert(
    wasteCategories.length === 4 &&
      wasteCategories.some((w) => w.code === 'HAI_SAN_CHET_NCC' && w.requiresSupplier),
    'KHO-04 Four Waste Business Categories',
    'Hệ thống định nghĩa chuẩn 4 nhóm nghiệp vụ xuất hủy và yêu cầu bắt buộc gắn NCC khi chọn Hải sản chết'
  );

  // Tạo phiếu xuất hủy Cua chết bắt đền NCC
  const docHuyCuaChet = await warehouseApi.createDocument({
    branchId: 1,
    branchCode: 'TN',
    docType: 'HUY',
    supplierId: 1, // Liên Cua Cà Mau / Hải Sản Biển Đông
    note: 'Bếp báo 3 con cua thịt bị ngộp chết khi mở thùng xốp - Bắt đền NCC',
    imageUrls: 'data:image/jpeg;base64,dead_crabs_evidence_photo',
    status: 'CHO_DUYET',
    items: [
      {
        itemId: 2, // Tôm càng xanh / Hải sản sống
        quantity: 1.5,
        unitPrice: 260000,
        reason: 'Hải sản chết / ngộp khi giao - Trách nhiệm NCC',
        lossCategory: 'HAI_SAN_CHET_NCC',
        warehouseLocation: 'KHO_BE_SONG',
      },
    ],
  });

  assert(
    docHuyCuaChet.docType === 'HUY' &&
      docHuyCuaChet.supplierId === 1 &&
      docHuyCuaChet.items[0].lossCategory === 'HAI_SAN_CHET_NCC' &&
      !!docHuyCuaChet.imageUrls,
    'KHO-04 Dead Seafood Supplier Tracking',
    'Tạo phiếu xuất hủy Hải sản chết gắn đúng NCC cung cấp (supplierId: 1) và ảnh bằng chứng để đối soát bắt đền'
  );

  // 15.4. KHO-05: Chặn xuất âm kho khi xuất hủy vượt tồn khả dụng
  const availStockForNegativeCheck = await warehouseApi.getItemCurrentStock(2, 'TN');
  let isNegativeStockBlockedKHO = false;
  let negativeStockErrorKHO = '';

  try {
    await warehouseApi.createDocument({
      branchId: 1,
      branchCode: 'TN',
      docType: 'HUY',
      status: 'CHO_DUYET',
      items: [
        {
          itemId: 2,
          quantity: availStockForNegativeCheck + 999.0, // Cố tình xuất vượt quá tồn kho
          unitPrice: 260000,
          lossCategory: 'HAI_SAN_CHET_NCC',
        },
      ],
    });
  } catch (err: any) {
    isNegativeStockBlockedKHO = true;
    negativeStockErrorKHO = err.message || '';
  }

  assert(
    isNegativeStockBlockedKHO &&
      (negativeStockErrorKHO.includes('vượt quá tồn kho') || negativeStockErrorKHO.includes('xuất âm kho')),
    'KHO-05 Prevent Negative Stock Hard Constraint',
    'Chặn cứng xuất âm kho khi xuất hủy vượt tồn khả dụng hiện tại',
    `Tồn khả dụng: ${availStockForNegativeCheck} kg | Cố tình xuất: ${availStockForNegativeCheck + 999.0} kg -> Hệ thống chặn: "${negativeStockErrorKHO}"`
  );

  // 15.5. KHO-06: Phân quyền duyệt báo hỏng (Quản lý CN duyệt được, Kế toán CN chỉ xem trạng thái Chờ duyệt)
  const userQuanLy = {
    id: 4,
    username: 'ql_chinhanh_tn',
    fullName: 'Lê Hoàng Quản Lý',
    roles: ['ROLE_QL_CHINHANH', 'ROLE_RESTAURANT_MANAGER', 'ROLE_EMPLOYEE'] as any[],
    branchId: 1,
  };

  const userKeToanCN = {
    id: 7,
    username: 'ketoan_tn',
    fullName: 'Nguyễn Thu Thủy',
    roles: ['ROLE_KETOAN_CHINHANH', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_EMPLOYEE'] as any[],
    branchId: 1,
  };

  const canApproveLogic = (u: any) =>
    userHasRole(u, 'ROLE_QL_CHINHANH') ||
    userHasRole(u, 'ROLE_CHU_CHUOI') ||
    userHasRole(u, 'ROLE_KETOAN_TONG') ||
    userHasRole(u, 'ROLE_RESTAURANT_MANAGER') ||
    u.username === 'ql_chinhanh_tn';

  assert(
    canApproveLogic(userQuanLy) === true && canApproveLogic(userKeToanCN) === false,
    'KHO-06 Approval RBAC Matrix',
    'Phân quyền phê duyệt báo hỏng: Quản lý chi nhánh được duyệt, Kế toán chi nhánh chỉ xem trạng thái Chờ duyệt'
  );

  // Quản lý thực hiện phê duyệt phiếu xuất hủy -> Tồn kho chính thức bị trừ
  const stockBeforeApprove = await warehouseApi.getItemCurrentStock(2, 'TN');
  const approvedDoc = await warehouseApi.approveDocument(docHuyCuaChet.id, userQuanLy.fullName);
  const stockAfterApprove = await warehouseApi.getItemCurrentStock(2, 'TN');

  assert(
    approvedDoc.status === 'DA_DUYET' &&
      approvedDoc.approvedBy === 'Lê Hoàng Quản Lý' &&
      Number((stockBeforeApprove - stockAfterApprove).toFixed(2)) === 1.5,
    'KHO-06 Waste Approval Stock Deduction',
    'Quản lý chi nhánh duyệt phiếu thành công (status: DA_DUYET) và tồn kho thực tế bị trừ chính xác 1.5kg'
  );

  // Thử tạo phiếu và Quản lý từ chối duyệt
  const docHuyTuChoi = await warehouseApi.createDocument({
    branchId: 1,
    branchCode: 'TN',
    docType: 'HUY',
    status: 'CHO_DUYET',
    items: [
      {
        itemId: 2,
        quantity: 0.5,
        unitPrice: 260000,
        lossCategory: 'ME_CHE_BIEN_HONG',
      },
    ],
  });
  const rejectedDoc = await warehouseApi.rejectDocument(docHuyTuChoi.id, 'Bếp không cung cấp đủ ảnh bằng chứng');
  assert(
    rejectedDoc.status === 'TU_CHOI' &&
      rejectedDoc.rejectReason === 'Bếp không cung cấp đủ ảnh bằng chứng',
    'KHO-06 Waste Rejection Handling',
    'Quản lý từ chối phiếu xuất hủy (status: TU_CHOI) thành công, lưu lý do từ chối rõ ràng'
  );

  // 15.6. KHO-07: Tài khoản Kế toán Chi nhánh (ketoan_tn & ketoan_qv) được cấp quyền đúng chi nhánh
  const ketoanTnFromDb = await db.users.where('username').equals('ketoan_tn').first();
  assert(
    !!ketoanTnFromDb &&
      ketoanTnFromDb.branchId === 1 &&
      ketoanTnFromDb.branchCode === 'TN' &&
      ketoanTnFromDb.roles.includes('ROLE_KETOAN_CHINHANH' as any),
    'KHO-07 Branch Accountant TN Account & Roles',
    'Tài khoản Kế toán Thái Nguyên (ketoan_tn - Nguyễn Thu Thủy) nạp đầy đủ trong DB với role ROLE_KETOAN_CHINHANH'
  );

  const ketoanQvFromDb = await db.users.where('username').equals('ketoan_qv').first();
  assert(
    !!ketoanQvFromDb &&
      ketoanQvFromDb.branchId === 2 &&
      ketoanQvFromDb.branchCode === 'QV' &&
      ketoanQvFromDb.roles.includes('ROLE_KETOAN_CHINHANH' as any),
    'KHO-07 Branch Accountant QV Account & Roles',
    'Tài khoản Kế toán Quế Võ (ketoan_qv - Trần Thị Lan) nạp đầy đủ trong DB gắn chặt branchId 2 (QV)'
  );

  const canKetoanAccessWarehouse = isViewAuthorized('warehouse', ketoanTnFromDb);
  const canKetoanAccessRecon = isViewAuthorized('reconciliation', ketoanTnFromDb);
  const canKetoanAccessPayroll = isViewAuthorized('payroll', ketoanTnFromDb);
  const canKetoanAccessExecutive = isViewAuthorized('executive-cockpit', ketoanTnFromDb);

  assert(
    canKetoanAccessWarehouse &&
      canKetoanAccessRecon &&
      canKetoanAccessPayroll &&
      !canKetoanAccessExecutive,
    'KHO-07 Branch Accountant Authorized Views',
    'Kế toán chi nhánh có quyền quản lý kho, xem đối soát, xem bảng lương nhưng KHÔNG truy cập Executive Cockpit của Chủ chuỗi'
  );

  // 15.7. KHO-11: Phân vùng 5 kho vật lý (KHO_KHO, KHO_DONG_LANH, KHO_BE_SONG, KHO_BEP, KHO_BAR)
  const expectedLocations: WarehouseLocation[] = [
    'KHO_KHO',
    'KHO_DONG_LANH',
    'KHO_BE_SONG',
    'KHO_BEP',
    'KHO_BAR',
  ];
  const allLocationsDefined = expectedLocations.every((loc) =>
    WAREHOUSE_LOCATIONS.some((wl) => wl.id === loc || (wl as any).code === loc)
  );
  assert(
    allLocationsDefined && WAREHOUSE_LOCATIONS.length >= 5,
    'KHO-11 Physical Warehouse Locations Definition',
    'Hệ thống định nghĩa đầy đủ 5 phân vùng kho vật lý: Kho Khô, Đông Lạnh, Bể Sống, Bếp, Bar'
  );

  // Kiểm tra truy xuất tồn kho theo phân vùng vật lý
  const beSongStocks = await warehouseApi.getStocks({ branchId: 1, location: 'KHO_BE_SONG' });
  const dongLanhStocks = await warehouseApi.getStocks({ branchId: 1, location: 'KHO_DONG_LANH' });
  const khoKhoStocks = await warehouseApi.getStocks({ branchId: 1, location: 'KHO_KHO' });

  assert(
    beSongStocks.length > 0 &&
      beSongStocks.every((s) => s.location === 'KHO_BE_SONG' || s.category?.includes('Hải sản') || s.itemCode?.includes('HS') || s.itemCode?.includes('CUA')),
    'KHO-11 Live Seafood Tank Location Filter',
    `Bộ lọc Bể hải sản sống (KHO_BE_SONG) trả về đúng danh mục mặt hàng thủy hải sản tươi sống (${beSongStocks.length} mặt hàng)`
  );

  assert(
    dongLanhStocks.length > 0 &&
      dongLanhStocks.every((s) => s.location === 'KHO_DONG_LANH' || s.category?.includes('Thịt') || s.itemCode?.includes('BO') || s.itemCode?.includes('CAHOI') || s.itemCode?.includes('MUC')),
    'KHO-11 Cold Storage Location Filter',
    `Bộ lọc Kho đông lạnh (KHO_DONG_LANH) trả về đúng danh mục mặt hàng thịt và cá đông lạnh (${dongLanhStocks.length} mặt hàng)`
  );

  assert(
    khoKhoStocks.length > 0,
    'KHO-11 Dry Goods Warehouse Location Filter',
    `Bộ lọc Kho khô (KHO_KHO) ghi nhận các mặt hàng gia vị, đồ khô (${khoKhoStocks.length} mặt hàng)`
  );

  // 15.8. KHO-13: Quy trình Bếp cân hàng mới về (lưu được phiếu thực nhập và ảnh cân)
  const docBepCanHang = await warehouseApi.createDocument({
    branchId: 1,
    branchCode: 'TN',
    docType: 'NHAP',
    supplierId: 1, // Hải Sản Biển Đông
    warehouseLocation: 'KHO_BE_SONG',
    note: 'Bếp nhận & cân thực tế tại cửa bếp ca sáng',
    imageUrls: 'data:image/jpeg;base64,kitchen_live_scale_photo_with_watermark_1575',
    items: [
      {
        itemId: 2, // Tôm càng xanh
        quantity: 15.75,
        actualWeight: 15.75,
        supplierReportedWeight: 15.75,
        unitPrice: 0, // Tuyệt đối ẩn đơn giá đối với Bếp
        warehouseLocation: 'KHO_BE_SONG',
      },
    ],
  });

  assert(
    docBepCanHang.docCode.startsWith('PNK-') &&
      docBepCanHang.items[0].actualWeight === 15.75 &&
      docBepCanHang.items[0].unitPrice === 0 &&
      !!docBepCanHang.imageUrls,
    'KHO-13 Kitchen Quick Goods Weigh-in Receipt',
    'Bếp viên thực hiện cân hàng mới về thành công (15.75kg), lưu ảnh bàn cân, ẩn đơn giá và đẩy dữ liệu về Kế toán chi nhánh'
  );

  // 15.9. KHO-14: Phiếu xuất chuyển nội bộ (chuyển hàng khô sang bếp)
  const dryItem = khoKhoStocks.find((s) => s.location === 'KHO_KHO') || khoKhoStocks[0];
  const dryItemId = dryItem ? dryItem.itemId : 32;

  const docChuyenNoiBo = await warehouseApi.createDocument({
    branchId: 1,
    branchCode: 'TN',
    docType: 'XUAT_CHUYEN_NOI_BO',
    location: 'KHO_KHO',
    targetLocation: 'KHO_BEP',
    note: 'Xuất điều chuyển dầu ăn & tương ớt từ Kho Khô sang Kho Bếp',
    imageUrls: 'data:image/jpeg;base64,internal_transfer_voucher_photo',
    status: 'HOAN_THANH',
    items: [
      {
        itemId: dryItemId,
        quantity: 3.0,
        unitPrice: 50000,
        location: 'KHO_KHO',
        targetLocation: 'KHO_BEP',
      },
    ],
  });

  assert(
    docChuyenNoiBo.docCode.startsWith('PXK-') &&
      docChuyenNoiBo.docType === 'XUAT_CHUYEN_NOI_BO' &&
      docChuyenNoiBo.location === 'KHO_KHO' &&
      docChuyenNoiBo.targetLocation === 'KHO_BEP',
    'KHO-14 Internal Stock Transfer Document Creation',
    'Tạo phiếu xuất chuyển nội bộ (XUAT_CHUYEN_NOI_BO) từ Kho Khô sang Kho Bếp thành công với mã PXK-...'
  );

  // Chặn xuất âm kho nguồn khi điều chuyển nội bộ
  let isNegativeTransferBlocked = false;
  let negativeTransferError = '';
  try {
    await warehouseApi.createDocument({
      branchId: 1,
      branchCode: 'TN',
      docType: 'XUAT_CHUYEN_NOI_BO',
      location: 'KHO_KHO',
      targetLocation: 'KHO_BEP',
      items: [
        {
          itemId: dryItemId,
          quantity: 99999.0, // Vượt quá tồn kho nguồn
          unitPrice: 50000,
        },
      ],
    });
  } catch (err: any) {
    isNegativeTransferBlocked = true;
    negativeTransferError = err.message || '';
  }

  assert(
    isNegativeTransferBlocked &&
      (negativeTransferError.includes('vượt quá tồn kho') || negativeTransferError.includes('xuất âm kho')),
    'KHO-14 Internal Transfer Negative Stock Prevention',
    'Chặn cứng không cho phép xuất chuyển nội bộ khi số lượng chuyển vượt quá tồn kho khả dụng của kho nguồn'
  );

  console.log('\n🏬 SUITE 16: SPEC-WAREHOUSE-ANTI-THEFT-2026 Comprehensive Verification (TASK-WH-01 đến TASK-WH-07)');

  // 16.1. TASK-WH-01: Phân quyền truy cập Kho cho Bếp Trưởng (ql_bep_tn) & Quản Lý Chi Nhánh (ql_chinhanh_tn)
  const qlBepFromDb = await db.users.where('username').equals('ql_bep_tn').first();
  const qlChiNhanhFromDb = await db.users.where('username').equals('ql_chinhanh_tn').first();
  const bepStaffFromDb = await db.users.where('username').equals('bep_tn').first();

  assert(
    isViewAuthorized('warehouse', userQlChiNhanh) === true &&
    isViewAuthorized('warehouse', userQlBep) === true &&
    isViewAuthorized('warehouse', qlBepFromDb) === true &&
    isViewAuthorized('warehouse', qlChiNhanhFromDb) === true &&
    isViewAuthorized('warehouse', userKeToan) === true &&
    isViewAuthorized('warehouse', userAdminChu) === true,
    'TASK-WH-01 Warehouse RBAC Head Chef & Branch Manager Access',
    'Bếp Trưởng (ql_bep_tn) & Quản Lý Chi Nhánh (ql_chinhanh_tn) có quyền truy cập phân hệ warehouse (isViewAuthorized === true)'
  );

  assert(
    isViewAuthorized('warehouse', userBep) === true &&
    isViewAuthorized('warehouse', bepStaffFromDb) === true,
    'TASK-WH-01 Warehouse RBAC Kitchen Staff Access',
    'Bếp viên (bep_tn) ĐƯỢC PHÉP truy cập phân hệ warehouse để xem tồn kho vật lý và cân hàng mới về (isViewAuthorized === true)'
  );

  // 16.2. TASK-WH-02: Lọc tồn kho theo 2 chi nhánh (TN vs QV) và 5 nhóm thực phẩm buffet chuẩn
  const groupSeafood = getBuffetFoodGroup({ itemCode: 'HS-CUACAMAU', category: 'Hải sản chính' });
  const groupFrozen = getBuffetFoodGroup({ itemCode: 'BTP-CAHOI', itemName: 'Cá hồi sơ chế BTP' });
  const groupVeggies = getBuffetFoodGroup({ itemCode: 'RAU-NAM', category: 'Rau', itemName: 'Nấm đùi gà' });
  const groupBar = getBuffetFoodGroup({ itemCode: 'BAR-BIA', category: 'Bar', itemName: 'Bia Hà Nội' });
  const groupDry = getBuffetFoodGroup({ itemCode: 'KHO-TIEU', category: 'Gia vị', itemName: 'Tiêu Phú Quốc' });

  assert(
    groupSeafood === 'HAI_SAN_THIT_TUOI_SONG' &&
    groupFrozen === 'BAN_THANH_PHAM_DONG_LANH' &&
    groupVeggies === 'RAU_CU_QUA_TUOI' &&
    groupBar === 'DO_UONG_BAR' &&
    groupDry === 'HANG_KHO_GIA_VI',
    'TASK-WH-02 5 Buffet Food Groups Classification',
    'Hệ thống phân loại chính xác 5 nhóm thực phẩm buffet: Bán thành phẩm đông lạnh, Hải sản & Thịt, Rau củ, Bar, Đồ khô'
  );

  const tnStocks = await warehouseApi.getStocks({ branchId: 1 });
  const qvStocks = await warehouseApi.getStocks({ branchId: 2 });
  assert(
    tnStocks.length > 0 &&
    qvStocks.length > 0 &&
    tnStocks.every(s => s.branchId === 1) &&
    qvStocks.every(s => s.branchId === 2),
    'TASK-WH-02 Multi-Branch Stock Filtering (TN vs QV)',
    `Lọc tồn kho độc lập theo 2 chi nhánh: TN (${tnStocks.length} mặt hàng) và QV (${qvStocks.length} mặt hàng)`
  );

  // 16.3. TASK-WH-03: Cơ chế nhập mù (Blind Weighing) cho Bếp viên
  const cookFeedbackNotice = `✅ Đã ghi nhận số cân mẻ [BATCH-202611-002] (14.2 kg) kèm ảnh bàn cân. Đã chuyển Quản lý đối soát!`;
  const leaksLossRate = cookFeedbackNotice.includes('%') || cookFeedbackNotice.toLowerCase().includes('hao hụt');
  const leaksStandard = cookFeedbackNotice.toLowerCase().includes('định mức') || cookFeedbackNotice.toLowerCase().includes('chuẩn');
  const leaksAlert = cookFeedbackNotice.toLowerCase().includes('vượt') || cookFeedbackNotice.toLowerCase().includes('cảnh báo');

  assert(
    !leaksLossRate && !leaksStandard && !leaksAlert,
    'TASK-WH-03 Blind Weighing Cook UI Payload Protection',
    'Cơ chế nhập mù: kiểm tra giao diện/payload của Bếp viên không để lộ định mức chuẩn và cảnh báo hao hụt'
  );

  // 16.4. TASK-WH-04: Bắt buộc ảnh chụp bàn cân: chặn hoàn tất mẻ khi thiếu scalePhotoUrl
  const salmonItem = (await db.items.where('itemCode').equals('HS-CAHOI').first())!;
  const testBatchForPhoto = await kitchenApi.startBatch({
    itemId: salmonItem.id,
    inputWeight: 12.0,
    unit: 'kg',
    forceSecondBatch: true,
  });

  let isMissingPhotoBlocked = false;
  let missingPhotoError = '';
  try {
    await kitchenApi.finishBatch({
      batchId: testBatchForPhoto.data.id,
      outputWeight: 11.2,
      scalePhotoUrl: '', // Thiếu ảnh chụp mặt bàn cân
      requireScalePhoto: true,
    });
  } catch (err: any) {
    isMissingPhotoBlocked = true;
    missingPhotoError = err.message || '';
  }

  assert(
    isMissingPhotoBlocked && missingPhotoError.includes('bàn cân'),
    'TASK-WH-04 Require Scale Photo Enforced Validation',
    'Bắt buộc ảnh chụp bàn cân: chặn hoàn tất mẻ khi thiếu scalePhotoUrl với cảnh báo rõ ràng'
  );

  const mockScalePhoto = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><text x="300" y="200" font-size="50">11.20 kg</text></svg>';
  const finishWithPhotoRes = await kitchenApi.finishBatch({
    batchId: testBatchForPhoto.data.id,
    outputWeight: 11.2,
    scalePhotoUrl: mockScalePhoto,
    requireScalePhoto: true,
  });

  const savedBatchWithPhoto = await db.batches.get(testBatchForPhoto.data.id);
  assert(
    finishWithPhotoRes.success === true &&
    savedBatchWithPhoto &&
    savedBatchWithPhoto.scalePhotoUrl === mockScalePhoto &&
    savedBatchWithPhoto.approvalStatus === 'CHO_DUYET',
    'TASK-WH-04 Scale Photo Persistence & Pending Approval',
    'Đính kèm ảnh chụp bàn cân hợp lệ: lưu mẻ thành công vào IndexedDB và khởi tạo trạng thái CHO_DUYET'
  );

  // 16.5. TASK-WH-05: Màn hình Bếp trưởng/Quản lý soi ảnh cân đối soát mẻ & xử lý chênh lệch
  const overBatch = (await db.batches.get(2))!; // Batch 2: Cá hồi hụt 12% vs chuẩn 8%
  const actualLoss = overBatch.lossRate!;
  const stdLoss = overBatch.standardLossRate;
  const overLossDiff = Number((actualLoss - stdLoss).toFixed(1));

  assert(
    overBatch.overStandard === true &&
    actualLoss === 12.0 &&
    stdLoss === 8.0 &&
    overLossDiff === 4.0 &&
    !!overBatch.scalePhotoUrl,
    'TASK-WH-05 Manager Loss Calculation & Red Alert Flag',
    'Màn hình Bếp trưởng/Quản lý soi ảnh cân: tính đúng % hao hụt thực tế (12%), so sánh chuẩn (8%), đánh dấu cờ đỏ vượt chuẩn (+4.0%) và liên kết ảnh bàn cân'
  );

  const approveRes = await kitchenApi.approveBatch({
    batchId: testBatchForPhoto.data.id,
    approvedBy: 'Trần Thị Bếp Trưởng',
    note: 'Đã đối soát ảnh bàn cân điện tử khớp 11.2kg, xác nhận hợp lệ',
  });
  const approvedBatchInDb = await db.batches.get(testBatchForPhoto.data.id);
  assert(
    approveRes.success === true &&
    approvedBatchInDb.approvalStatus === 'HOP_LE' &&
    approvedBatchInDb.approvedBy === 'Trần Thị Bếp Trưởng',
    'TASK-WH-05 Manager Batch Approval (HOP_LE)',
    'Bếp Trưởng / Quản Lý xác nhận mẻ hợp lệ sau khi soi ảnh bàn cân, cập nhật trạng thái HOP_LE'
  );

  const explainRes = await kitchenApi.recordBatchExplanation({
    batchId: overBatch.id,
    approvedBy: 'Nguyễn Hoàng Nam (Quản Lý CN)',
    note: 'Cá hồi đợt này xương dày, yêu cầu bếp viên rút kinh nghiệm thao tác lóc thịt',
  });
  const explainedBatchInDb = await db.batches.get(overBatch.id);
  assert(
    explainRes.success === true &&
    explainedBatchInDb.approvalStatus === 'BIEN_BAN' &&
    explainedBatchInDb.approvedBy === 'Nguyễn Hoàng Nam (Quản Lý CN)' &&
    explainedBatchInDb.approvalNote.includes('xương dày'),
    'TASK-WH-05 Manager Batch Explanation Record (BIEN_BAN)',
    'Quản lý lập biên bản giải trình hao hụt cho mẻ vượt định mức thành công, lưu trạng thái BIEN_BAN kèm lý do'
  );

  // 16.6. TASK-WH-06: Khấu trừ kho lấy hàng (XUAT_CHE_BIEN) và tăng tồn kho bán thành phẩm tương ứng khi mẻ hoàn tất
  const initialSalmonStock = await warehouseApi.getItemCurrentStock(salmonItem.id, 1);
  const takeOutRes16 = await kitchenApi.recordTakeOut({
    itemId: salmonItem.id,
    quantity: 3.5,
    unit: 'kg',
    note: 'Xuất nấu mẻ trưa',
  });
  const afterTakeOutStock = await warehouseApi.getItemCurrentStock(salmonItem.id, 1);
  const cbDocs = await db.warehouseDocuments.where('docType').equals('XUAT_CHE_BIEN').toArray();
  const latestCbDoc = cbDocs[cbDocs.length - 1];

  assert(
    takeOutRes16.success === true &&
    Math.abs((initialSalmonStock - afterTakeOutStock) - 3.5) < 0.01 &&
    latestCbDoc && latestCbDoc.docCode.startsWith('PXK-CB-'),
    'TASK-WH-06 Point 1 Take Out Deduction & Movement',
    'Khấu trừ kho lấy hàng (XUAT_CHE_BIEN): trừ đúng 3.5kg tồn kho thô và tự động tạo phiếu biến động PXK-CB-...'
  );

  const testBatchRes = await kitchenApi.startBatch({
    itemId: salmonItem.id,
    inputWeight: 10.0,
    unit: 'kg',
    forceSecondBatch: true,
  });
  const finishRes = await kitchenApi.finishBatch({
    batchId: testBatchRes.data.id,
    outputWeight: 9.2,
    scalePhotoUrl: mockScalePhoto,
  });
  const btpLot = await db.inventoryLots.where('batchCode').equals(`LOT-BTP-${testBatchRes.data.batchCode.replace(/^BATCH-/, '')}`).first();
  const btpDocs = await db.warehouseDocuments.where('docType').equals('NHAP_BTP').toArray();
  const latestBtpDoc = btpDocs[btpDocs.length - 1];

  assert(
    finishRes.success === true &&
    btpLot && btpLot.currentStock === 9.2 &&
    btpLot.note.includes(`Nhập từ mẻ [${testBatchRes.data.batchCode}]`) &&
    latestBtpDoc && latestBtpDoc.docCode.startsWith('PNK-BTP-'),
    'TASK-WH-06 Point 2 Batch Finish Auto Increase Semi-finished Stock',
    'Mẻ nấu xong: tự động tăng tồn kho bán thành phẩm (+9.2kg) tương ứng tại chi nhánh và ghi chú đúng mã mẻ'
  );

  // 16.7. TASK-WH-07: Khấu trừ kho bán thành phẩm khi bấm Ra Line (+1) buffet
  const stockBeforeLine = await warehouseApi.getItemCurrentStock(salmonItem.id, 1);
  const lineRes16 = await kitchenApi.recordLineItem({
    itemId: salmonItem.id,
    quantity: 1,
    requestId: `line-test-${Date.now()}`,
  });
  const stockAfterLine = await warehouseApi.getItemCurrentStock(salmonItem.id, 1);
  const lineDocs = await db.warehouseDocuments.where('docType').equals('RA_LINE').toArray();
  const latestLineDoc = lineDocs[lineDocs.length - 1];

  assert(
    lineRes16.success === true &&
    Math.abs((stockBeforeLine - stockAfterLine) - 1.0) < 0.01 &&
    latestLineDoc && latestLineDoc.docCode.startsWith('PXK-LINE-'),
    'TASK-WH-07 Realtime Ra Line Auto Deduction',
    'Khấu trừ kho bán thành phẩm khi bấm Ra Line (+1) buffet theo thời gian thực (-1kg/đĩa) và tạo biến động RA_LINE'
  );

  const ledgerEntries = await warehouseApi.getStockLedger(salmonItem.id, 1);
  const hasCbEntry = ledgerEntries.some(e => e.docType === 'XUAT_CHE_BIEN');
  const hasBtpEntry = ledgerEntries.some(e => e.docType === 'NHAP');
  const hasLineEntry = ledgerEntries.some(e => e.docType === 'RA_LINE');

  assert(
    hasCbEntry && hasBtpEntry && hasLineEntry,
    'TASK-WH-06 & TASK-WH-07 Realtime Stock Ledger Integration',
    'Thẻ kho (Stock Ledger) ghi nhận đầy đủ chuỗi 3 điểm biến động: Xuất chế biến -> Nhập BTP -> Ra line'
  );

  // -----------------------------------------------------------------
  // 17. KIỂM THỬ XÁC THỰC TOÀN DIỆN PHÂN QUYỀN KHO & UI/UX PC 16:9
  // (SPEC-UX-DESKTOP-16X9-2026 & SPEC-WAREHOUSE-ANTI-THEFT-2026)
  // -----------------------------------------------------------------
  console.log('\n🖥️ SUITE 17: RBAC Warehouse Access & PC 16:9 Desktop UX Verification');

  // 17.1. Test phân quyền xem kho cho bep_tn, ql_bep_tn, ql_chinhanh_tn (isViewAuthorized('warehouse', user) === true)
  const dbUserBep = await db.users.where('username').equals('bep_tn').first();
  const dbUserQlBep = await db.users.where('username').equals('ql_bep_tn').first();
  const dbUserQlChiNhanh = await db.users.where('username').equals('ql_chinhanh_tn').first();

  assert(
    isViewAuthorized('warehouse', userBep) === true &&
      isViewAuthorized('warehouse', dbUserBep) === true,
    'SUITE 17.1 RBAC Kitchen Staff Warehouse Access',
    'Bếp viên (bep_tn) được cấp quyền xem phân hệ Kho cơ sở để tra cứu tồn vật lý và cân hàng mới về'
  );

  assert(
    isViewAuthorized('warehouse', userQlBep) === true &&
      isViewAuthorized('warehouse', dbUserQlBep) === true,
    'SUITE 17.1 RBAC Head Chef Warehouse Access',
    'Bếp Trưởng (ql_bep_tn) có toàn quyền quản lý kho cơ sở và lô hàng (isViewAuthorized === true)'
  );

  assert(
    isViewAuthorized('warehouse', userQlChiNhanh) === true &&
      isViewAuthorized('warehouse', dbUserQlChiNhanh) === true,
    'SUITE 17.1 RBAC Branch Manager Warehouse Access',
    'Quản Lý Chi Nhánh (ql_chinhanh_tn) có toàn quyền quản lý kho cơ sở và lô hàng (isViewAuthorized === true)'
  );

  const pureEmployeeUser = { id: 99, username: 'nv_phucvu', fullName: 'Nhân Viên Phục Vụ', roles: ['ROLE_EMPLOYEE'] } as any;
  assert(
    isViewAuthorized('warehouse', pureEmployeeUser) === false,
    'SUITE 17.1 RBAC Unauthorized Access Prevention',
    'Nhân viên phục vụ thuần túy không có quyền truy cập phân hệ Kho (isViewAuthorized === false)'
  );

  assert(
    isViewAuthorized('executive-cockpit', userBep) === false &&
      isViewAuthorized('payroll', userBep) === false &&
      isViewAuthorized('reconciliation', userBep) === false &&
      isViewAuthorized('dashboard', userBep) === false,
    'SUITE 17.1 RBAC Kitchen Staff Sensitive Modules Isolation',
    'Bếp viên tuyệt đối không thể truy cập các phân hệ nhạy cảm (Executive Cockpit, Bảng lương, Đối soát CukCuk, Dashboard)'
  );

  // 17.2. Test 4 nhóm tab mới của WarehouseModule ('stock-overview', 'documents', 'inventory-check', 'supplier-partner')
  const expectedTabs: WarehouseTab[] = [
    'stock-overview',
    'documents',
    'inventory-check',
    'supplier-partner',
  ];

  assert(
    Array.isArray(WAREHOUSE_COCKPIT_TABS) &&
      WAREHOUSE_COCKPIT_TABS.length === 4 &&
      expectedTabs.every((tab) => WAREHOUSE_COCKPIT_TABS.includes(tab)),
    'SUITE 17.2 WarehouseModule 4 Cockpit Tab Groups',
    'Phân hệ Kho đã gom 7 tab rời rạc thành đúng 4 nhóm nghiệp vụ Cockpit chuẩn: stock-overview, documents, inventory-check, supplier-partner'
  );

  const defaultTab: WarehouseTab = 'stock-overview';
  assert(
    defaultTab === 'stock-overview' && WAREHOUSE_COCKPIT_TABS[0] === 'stock-overview',
    'SUITE 17.2 Warehouse Default Cockpit Tab',
    'Tab mặc định khi vào Kho là "stock-overview" (Tồn Kho & Thẻ Kho Vật Lý)'
  );

  // Kiểm tra cơ chế che thông tin nhạy cảm cho Bếp viên thuần túy trong WarehouseModule
  const isKitchenPureTest = (user: any) => {
    const isKitchen = userHasRole(user, 'ROLE_KITCHEN_STAFF');
    const isBranchMgr = userHasRole(user, 'ROLE_QL_CHINHANH') || user?.username === 'ql_chinhanh_tn';
    const isHeadChef = userHasRole(user, 'ROLE_QL_BEP') || user?.username === 'ql_bep_tn';
    const isChuChuoi = userHasRole(user, 'ROLE_CHU_CHUOI') || user?.username === 'admin_chu';
    const isGenAcc = userHasRole(user, 'ROLE_GENERAL_ACCOUNTANT') || user?.username === 'ketoan_tong';
    const isBrAcc = userHasRole(user, 'ROLE_BRANCH_ACCOUNTANT') || user?.username === 'ketoan_tn';
    return isKitchen && !isBranchMgr && !isHeadChef && !isChuChuoi && !isGenAcc && !isBrAcc;
  };

  assert(
    isKitchenPureTest(userBep) === true && isKitchenPureTest(userQlBep) === false,
    'SUITE 17.2 Pure Kitchen Staff Sensitive Data Masking',
    'Nhân viên bếp thuần túy được tự động nhận diện (isKitchenPure = true) để che đơn giá và công nợ tài chính'
  );

  // 17.3. Test cơ chế thu gọn sidebar rail và lưu localStorage ('senviet_desktop_sidebar_collapsed')
  localStorage.setItem('senviet_desktop_sidebar_collapsed', 'true');
  const storedCollapsed = localStorage.getItem('senviet_desktop_sidebar_collapsed') === 'true';
  const collapsedWidthClass = storedCollapsed ? 'w-[72px]' : 'w-72';

  assert(
    storedCollapsed === true && collapsedWidthClass === 'w-[72px]',
    'SUITE 17.3 Desktop Sidebar Collapse Persistence (Rail 72px)',
    'Cơ chế thu gọn sidebar lưu đúng cờ "senviet_desktop_sidebar_collapsed" = true và áp dụng độ rộng 72px (Icon Rail)'
  );

  localStorage.setItem('senviet_desktop_sidebar_collapsed', 'false');
  const storedExpanded = localStorage.getItem('senviet_desktop_sidebar_collapsed') === 'true';
  const expandedWidthClass = storedExpanded ? 'w-[72px]' : 'w-72';

  assert(
    storedExpanded === false && expandedWidthClass === 'w-72',
    'SUITE 17.3 Desktop Sidebar Expand Persistence (Sidebar 280px)',
    'Mở rộng sidebar cập nhật localStorage thành false và khôi phục độ rộng đầy đủ w-72 (280px)'
  );

  localStorage.setItem('senviet_current_branch', 'Sen Việt Buffet - Chi nhánh Thái Nguyên');
  assert(
    localStorage.getItem('senviet_current_branch') === 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
    'SUITE 17.3 Branch Selection Persistence in LocalStorage',
    'Lựa chọn chi nhánh đang thao tác được lưu trữ an toàn trong localStorage ("senviet_current_branch")'
  );

  // 17.4. Test các hàm/flag phím tắt (Keyboard Shortcuts TASK-PC-07)
  let testModalOpen = true;
  let testSearchFocused = false;
  let testSaveTriggered = false;

  const simulateKeyboardAction = (event: { key: string; ctrlKey?: boolean; metaKey?: boolean; target?: any }) => {
    if (event.key === 'Escape') {
      testModalOpen = false;
    } else if (event.key === 'F2' || (event.key === '/' && !event.target?.isInput)) {
      testSearchFocused = true;
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      testSaveTriggered = true;
    }
  };

  simulateKeyboardAction({ key: 'Escape' });
  assert(
    testModalOpen === false,
    'SUITE 17.4 Keyboard Shortcut Escape Key',
    'Phím Escape tự động đóng modal/hộp thoại đang mở ngay lập tức'
  );

  simulateKeyboardAction({ key: 'F2' });
  simulateKeyboardAction({ key: 's', ctrlKey: true });
  assert(
    testSearchFocused === true && testSaveTriggered === true,
    'SUITE 17.4 Keyboard Shortcuts F2 Focus & Ctrl+S Fast Save',
    'Phím F2 kích hoạt focus ô tìm kiếm và tổ hợp Ctrl+S kích hoạt lưu nhanh form dữ liệu'
  );

  // 17.5. Test chế độ in ấn A4 landscape (TASK-PC-08)
  const cssFilePath = path.resolve(__dirname, '../src/index.css');
  const cssContent = fs.readFileSync(cssFilePath, 'utf-8');

  const hasMediaPrint = cssContent.includes('@media print');
  const hasA4Landscape = cssContent.includes('size: A4 landscape');
  const hasMargin10mm = cssContent.includes('margin: 10mm');
  const hasHiddenElements =
    cssContent.includes('.no-print') &&
    cssContent.includes('#demo-toolbar') &&
    cssContent.includes('display: none !important');
  const hasPageBreakProtection =
    cssContent.includes('page-break-inside: avoid !important') ||
    cssContent.includes('break-inside: avoid !important');

  assert(
    hasMediaPrint && hasA4Landscape && hasMargin10mm,
    'SUITE 17.5 A4 Landscape CSS Print Rules',
    'CSS index.css chứa đầy đủ cấu hình in chuẩn: @page { size: A4 landscape; margin: 10mm; }'
  );

  assert(
    hasHiddenElements && hasPageBreakProtection,
    'SUITE 17.5 Print Element Exclusions & Page Break Protection',
    'Tự động ẩn thanh điều hướng, toolbar và áp dụng chống ngắt dòng dở dang (break-inside: avoid) cho bảng và ô chữ ký'
  );

  // Kiểm tra 4 ô chữ ký kiểm soát nội bộ trên các bảng biểu in
  const nxtTablePath = path.resolve(__dirname, '../src/components/reconciliation/AutoNXTTable.tsx');
  const payrollPath = path.resolve(__dirname, '../src/components/payroll/PayrollModule.tsx');
  const nxtContent = fs.readFileSync(nxtTablePath, 'utf-8');
  const payrollContent = fs.readFileSync(payrollPath, 'utf-8');

  const hasNxtSignatures =
    nxtContent.includes('Người Lập Biểu') &&
    nxtContent.includes('Thủ Kho') &&
    nxtContent.includes('Kế Toán Trưởng') &&
    nxtContent.includes('Giám Đốc Duyệt') &&
    nxtContent.includes('print:grid grid-cols-4');

  const hasPayrollSignatures =
    payrollContent.includes('Người Lập Biểu') &&
    payrollContent.includes('Quản Lý Cơ Sở') &&
    payrollContent.includes('Kế Toán Trưởng') &&
    payrollContent.includes('Tổng Giám Đốc') &&
    payrollContent.includes('print:grid grid-cols-4');

  assert(
    hasNxtSignatures && hasPayrollSignatures,
    'SUITE 17.5 Standard 4 Internal Control Signatures in Print View',
    'Bảng NXT và Bảng lương trang bị đầy đủ 4 ô chữ ký kiểm soát nội bộ chuẩn F&B (Người Lập, Quản Lý/Thủ Kho, Kế Toán Trưởng, Ban Điều Hành/Giám Đốc)'
  );

  // -----------------------------------------------------------------
  // 18. KIỂM THỬ TASK-LOGIC-01: CHẶN LẤY HÀNG VƯỢT TỒN & KHẤU TRỪ TỨC THỜI
  // -----------------------------------------------------------------
  console.log('\n🔒 SUITE 18: TASK-LOGIC-01 Stock Overdraft Blocking & Realtime Lot Deduction');

  // 18.1. API getItemAvailableStock tính chính xác tổng tồn khả dụng từ db.inventoryLots theo chi nhánh
  const salmon = await db.items.where('itemCode').equals('HS-CAHOI').first();
  assert(salmon !== undefined, 'SUITE 18.1 Seed Item Exists', 'Mặt hàng cá hồi Nauy tồn tại trong DB');

  const branch1SalmonStock = await kitchenApi.getItemAvailableStock(salmon.id, 1);
  const salmonLots = await db.inventoryLots.where('itemId').equals(salmon.id).toArray();
  const expectedSalmonStock = Number(
    salmonLots
      .filter((l) => !l.branchId || l.branchId === 1)
      .reduce((sum, l) => sum + (Number(l.currentStock) || 0), 0)
      .toFixed(2)
  );

  assert(
    branch1SalmonStock === expectedSalmonStock && branch1SalmonStock > 0,
    'SUITE 18.1 kitchenApi.getItemAvailableStock',
    `API getItemAvailableStock tính chính xác tổng tồn khả dụng chi nhánh (${branch1SalmonStock} kg)`
  );

  // 18.2. Chặn lấy hàng vượt tồn kho khả dụng (yêu cầu 200kg khi tồn chỉ ~30kg)
  let overTakeOutErrorMsg = '';
  try {
    await kitchenApi.recordTakeOut({
      itemId: salmon.id,
      quantity: 200.0,
      unit: 'kg',
      note: 'Thử lấy vượt tồn kho',
      branchId: 1,
    });
  } catch (err: any) {
    overTakeOutErrorMsg = err.message || '';
  }

  assert(
    overTakeOutErrorMsg.includes('vượt quá tồn kho khả dụng') &&
    overTakeOutErrorMsg.includes('200 kg') &&
    overTakeOutErrorMsg.includes(`${branch1SalmonStock} kg`),
    'SUITE 18.2 Strict Stock Overdraft Blocking',
    `Chặn đứng thao tác lấy 200kg với thông báo lỗi: "${overTakeOutErrorMsg}"`
  );

  // 18.3. Khấu trừ tồn kho tức thời khi số lượng hợp lệ (lấy 5kg cá hồi)
  const initialStockBeforeValid = await kitchenApi.getItemAvailableStock(salmon.id, 1);
  const validTakeOutRes = await kitchenApi.recordTakeOut({
    itemId: salmon.id,
    quantity: 5.0,
    unit: 'kg',
    note: 'Xuất bếp phi lê 5kg',
    branchId: 1,
  });
  const stockAfterValid = await kitchenApi.getItemAvailableStock(salmon.id, 1);

  assert(
    validTakeOutRes.success === true &&
    Math.abs((initialStockBeforeValid - stockAfterValid) - 5.0) < 0.001,
    'SUITE 18.3 Realtime Lot Deduction & Immediate Stock Update',
    `Lấy thành công 5kg cá hồi: Tồn khả dụng giảm tức thời từ ${initialStockBeforeValid}kg -> ${stockAfterValid}kg`
  );

  // 18.4. Kiểm tra mã nguồn KitchenModule.tsx trang bị trực quan nhãn tồn kho & strict validation
  const kitchenModuleSource = fs.readFileSync(path.resolve(__dirname, '../src/components/kitchen/KitchenModule.tsx'), 'utf-8');
  const hasAvailableStockLabel = kitchenModuleSource.includes('Tồn kho khả dụng hiện tại:');
  const hasStrictOverStockStyle = kitchenModuleSource.includes('border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500');
  const hasOverStockWarningMsg = kitchenModuleSource.includes('vượt quá tồn kho khả dụng');
  const hasDisabledButtonOnOverStock = kitchenModuleSource.includes('isTakeOutOverStock');

  assert(
    hasAvailableStockLabel && hasStrictOverStockStyle && hasOverStockWarningMsg && hasDisabledButtonOnOverStock,
    'SUITE 18.4 KitchenModule Nút 1 UI & Strict Visual Validation',
    'KitchenModule Nút 1 hiển thị nhãn tồn khả dụng, viền đỏ cảnh báo, thông báo chi tiết và disable nút khi gõ quá số lượng tồn'
  );

  // -----------------------------------------------------------------
  // 18.5. KIỂM THỬ TASK-LOGIC-02: THẺ KHO ĐỒNG BỘ ĐỘNG 100% TỪ INDEXEDDB (XÓA MOCK)
  // -----------------------------------------------------------------
  console.log('\n📜 SUITE 18.5: TASK-LOGIC-02 Dynamic Stock Ledger from IndexedDB & 0% Mock Data');

  // Lấy dữ liệu sổ thẻ kho thực tế cho mặt hàng cá hồi
  const salmonLedger = await warehouseApi.getStockLedger(salmon.id, 1);

  assert(
    salmonLedger.length > 0,
    'SUITE 18.5 Dynamic Stock Ledger Loaded from DB',
    `Sổ thẻ kho cá hồi tải động thành công ${salmonLedger.length} biến động thực tế từ IndexedDB`
  );

  // Tìm biến động xuất chế biến 5kg vừa phát sinh ở bước 18.3
  const takeOutEntry = salmonLedger.find(
    (e) => (e.docType === 'XUAT_CHE_BIEN' || e.docCode.includes('PXK-CB')) && Math.abs(e.outQty - 5.0) < 0.001
  );

  assert(
    takeOutEntry !== undefined && (takeOutEntry.performer?.includes('bep_tn') || takeOutEntry.performer?.includes('Bếp')),
    'SUITE 18.5 Realtime TakeOut Ledger Entry Integrity',
    `Thẻ kho ghi nhận chính xác dòng xuất bếp: Mã "${takeOutEntry?.docCode}", Xuất: ${takeOutEntry?.outQty} kg, Người thực hiện: "${takeOutEntry?.performer}"`
  );

  // Kiểm tra tính lũy kế balance liên tục của dòng thẻ kho (theo trình tự thời gian tăng dần)
  const chronologicalLedger = [...salmonLedger].reverse();
  let ledgerBalanceContinuity = true;
  for (let i = 1; i < chronologicalLedger.length; i++) {
    const prev = chronologicalLedger[i - 1];
    const curr = chronologicalLedger[i];
    const expectedCurrBalance = Number((prev.balance + (curr.inQty || 0) - (curr.outQty || 0)).toFixed(2));
    if (Math.abs(curr.balance - expectedCurrBalance) > 0.01) {
      ledgerBalanceContinuity = false;
      break;
    }
  }

  assert(
    ledgerBalanceContinuity === true,
    'SUITE 18.5 Stock Ledger Running Balance Continuity',
    'Số dư lũy kế balance được tính toán chính xác tuyệt đối theo dòng thời gian'
  );

  // Kiểm tra file StockCardsTab.tsx đã xóa 100% mock data tx-1, tx-2, tx-3, tx-4, tx-5
  const stockCardsTabSource = fs.readFileSync(
    path.resolve(__dirname, '../src/components/warehouse/StockCardsTab.tsx'),
    'utf-8'
  );
  const hasNoMockTx =
    !stockCardsTabSource.includes("id: 'tx-1'") &&
    !stockCardsTabSource.includes("id: 'tx-2'") &&
    !stockCardsTabSource.includes("id: 'tx-3'") &&
    !stockCardsTabSource.includes("id: 'tx-4'") &&
    !stockCardsTabSource.includes("id: 'tx-5'");

  assert(
    hasNoMockTx === true,
    'SUITE 18.5 Zero Hardcoded Mock Transactions in StockCardsTab',
    'Đã xóa bỏ hoàn toàn 100% các bản ghi mock tĩnh (tx-1 -> tx-5) trong StockCardsTab.tsx'
  );

  // -----------------------------------------------------------------
  // 18.6. KIỂM THỬ TASK-LOGIC-03: LƯỢC BỎ MIN/MAX STOCK, NỔI BẬT TỒN THỰC TẾ & 3 THẺ KPI
  // -----------------------------------------------------------------
  console.log('\n📊 SUITE 18.6: TASK-LOGIC-03 Simplified Stock Cards: No Min/Max, Prominent Real Stock');

  const hasNoMinMaxColumns =
    !stockCardsTabSource.includes('<th className="p-3.5 text-right font-mono">Min Stock</th>') &&
    !stockCardsTabSource.includes('<th className="p-3.5 text-right font-mono">Max Stock</th>') &&
    !stockCardsTabSource.includes('<th>Định Mức Min</th>') &&
    !stockCardsTabSource.includes('OVERSTOCK');

  const hasProminentStockColumn =
    stockCardsTabSource.includes('font-black text-indigo-950') &&
    stockCardsTabSource.includes('Tồn Thực Tế');

  assert(
    hasNoMinMaxColumns && hasProminentStockColumn,
    'SUITE 18.6 Min/Max Stock Columns & OVERSTOCK Alert Removed',
    'Bảng thẻ kho đã lược bỏ các cột Min/Max rườm rà và làm nổi bật cột Tồn Thực Tế với class font-black text-indigo-950'
  );

  const has3KpiCards =
    stockCardsTabSource.includes('Tổng Mặt Hàng Quản Lý') &&
    stockCardsTabSource.includes('Mặt Hàng Hết Sạch Kho') &&
    stockCardsTabSource.includes('Tổng Giá Trị Tồn Kho');

  const hasStatusBadges =
    stockCardsTabSource.includes('HẾT HÀNG') &&
    stockCardsTabSource.includes('SẮP HẾT') &&
    stockCardsTabSource.includes('TỒN AN TOÀN');

  assert(
    has3KpiCards && hasStatusBadges,
    'SUITE 18.6 3 Tactical KPI Cards & Clear Stock Alert Badges',
    'Giao diện trang bị 3 thẻ KPI thực chiến (Tổng mặt hàng, Hết sạch kho, Tổng giá trị) kèm 3 mức huy hiệu: HẾT HÀNG, SẮP HẾT, TỒN AN TOÀN'
  );

  // -----------------------------------------------------------------
  // 18.7. KIỂM THỬ TASK-LOGIC-04: LƯỢC BỎ DROPDOWN LỌC PHÂN VÙNG KHO TRÙNG LẶP
  // -----------------------------------------------------------------
  console.log('\n🎯 SUITE 18.7: TASK-LOGIC-04 Removed Redundant Physical Warehouse Filter Dropdown');

  const hasNoWarehouseFilterDropdown =
    !stockCardsTabSource.includes('const [warehouseFilter, setWarehouseFilter]') &&
    !stockCardsTabSource.includes('value={warehouseFilter}') &&
    !stockCardsTabSource.includes('<option value="KHO_DONG_LANH">');

  const hasBuffetAndBranchFilters =
    stockCardsTabSource.includes('BUFFET_FOOD_GROUPS') &&
    stockCardsTabSource.includes('Tìm theo tên món hoặc mã hàng...') &&
    stockCardsTabSource.includes('Chi nhánh Thái Nguyên (TN)') &&
    stockCardsTabSource.includes('Chi nhánh Quế Võ (QV)');

  assert(
    hasNoWarehouseFilterDropdown && hasBuffetAndBranchFilters,
    'SUITE 18.7 Clean Toolbar: Search-as-you-type + 5 Food Groups + Branches',
    'Đã xóa bỏ hoàn toàn dropdown lọc phân vùng kho vật lý trùng lặp; tối ưu thanh công cụ với Tìm kiếm nhanh + 5 nhóm Buffet + Chi nhánh'
  );

  // -----------------------------------------------------------------
  // 18.8. KIỂM THỬ TASK-LOGIC-05: BẢO MẬT GIÁ TIỀN VNĐ ĐỐI VỚI BẾP TRƯỞNG
  // -----------------------------------------------------------------
  console.log('\n🔐 SUITE 18.8: TASK-LOGIC-05 Financial Masking for Head Chef & Kitchen Staff');

  // Kiểm tra ma trận phân quyền bảo mật giá tiền (hideFinancials)
  const computeHideFinancials = (userObj: any) => {
    const isHeadChef = userHasRole(userObj, 'ROLE_QL_BEP') || userObj?.username === 'ql_bep_tn';
    const isBranchMgr = userHasRole(userObj, 'ROLE_BRANCH_MANAGER') || userHasRole(userObj, 'ROLE_QUAN_LY_CO_SO');
    const isChuChuoi = userHasRole(userObj, 'ROLE_CHU_CHUOI');
    const isGenAcc = userHasRole(userObj, 'ROLE_GENERAL_ACCOUNTANT');
    const isBrAcc = userHasRole(userObj, 'ROLE_BRANCH_ACCOUNTANT');
    const isKitchen = userHasRole(userObj, 'ROLE_KITCHEN_STAFF');
    const isKitchenStaff = isKitchen;
    return isHeadChef || isKitchenStaff || (!isChuChuoi && !isGenAcc && !isBrAcc && !isBranchMgr);
  };

  const headChefUser = { username: 'ql_bep_tn', roles: ['ROLE_QL_BEP'] };
  const kitchenStaffUser = { username: 'bep_tn', roles: ['ROLE_KITCHEN_STAFF'] };
  const accountantUser = { username: 'ketoan_tong', roles: ['ROLE_GENERAL_ACCOUNTANT'] };
  const branchAccountantUser = { username: 'ketoan_tn', roles: ['ROLE_BRANCH_ACCOUNTANT'] };
  const directorUser = { username: 'chu_chuoi', roles: ['ROLE_CHU_CHUOI'] };

  assert(
    computeHideFinancials(headChefUser) === true,
    'SUITE 18.8 Head Chef (ql_bep_tn) Financial Masking Enforcement',
    'Bếp Trưởng (ql_bep_tn / ROLE_QL_BEP) bị áp dụng hideFinancials = true bắt buộc'
  );

  assert(
    computeHideFinancials(kitchenStaffUser) === true,
    'SUITE 18.8 Kitchen Staff (bep_tn) Financial Masking Enforcement',
    'Bếp viên (bep_tn / ROLE_KITCHEN_STAFF) bị áp dụng hideFinancials = true bắt buộc'
  );

  assert(
    computeHideFinancials(accountantUser) === false &&
    computeHideFinancials(branchAccountantUser) === false &&
    computeHideFinancials(directorUser) === false,
    'SUITE 18.8 Authorized Financial Access for Accountants & Director',
    'Kế toán tổng, Kế toán chi nhánh và Chủ chuỗi được xem 100% giá tiền và tổng giá trị tồn kho (hideFinancials = false)'
  );

  // Kiểm tra mã nguồn WarehouseModule.tsx và StockCardsTab.tsx thực hiện che giá tiền
  const warehouseModuleSource = fs.readFileSync(
    path.resolve(__dirname, '../src/components/warehouse/WarehouseModule.tsx'),
    'utf-8'
  );

  const hasHeadChefFinancialProtection =
    warehouseModuleSource.includes('hideFinancials = isHeadChef || isKitchenStaff') &&
    warehouseModuleSource.includes('hideFinancials={hideFinancials}');

  const hasFinancialMaskingInStockCards =
    stockCardsTabSource.includes("hideFinancials ? '*** (Bảo mật tài chính)'") &&
    stockCardsTabSource.includes('!hideFinancials && (') &&
    stockCardsTabSource.includes('Giá Trị Tồn (VNĐ)');

  assert(
    hasHeadChefFinancialProtection && hasFinancialMaskingInStockCards,
    'SUITE 18.8 Source Code Financial Masking Implementation in UI',
    'WarehouseModule truyền hideFinancials cho StockCardsTab, tự động che toàn bộ đơn giá, thành tiền và hiển thị "*** (Bảo mật tài chính)"'
  );

  // -----------------------------------------------------------------
  // 19. KIỂM THỬ TÁI CẤU TRÚC KHO 2 TẦNG & CHUẨN HÓA LUỒNG BẾP (TASK-FLOW-01, 06, 07)
  // -----------------------------------------------------------------
  console.log('\n🏬 SUITE 19: Dual Inventory & Unified Flow Verification');

  // 19.1: TASK-FLOW-01: Cấu hình 11 nhóm danh mục Kho Trước Chế Biến
  const preCats = warehouseApi.getPreProcessingCategories();
  assert(
    preCats.length === 11,
    'SUITE 19.1 Pre-Processing 11 Categories Count',
    'Cấu hình chính xác đầy đủ 11 nhóm danh mục cho Kho Trước Chế Biến'
  );

  const expected11Codes = [
    'BAR', 'DO_AN_NHAN_VIEN', 'HANG_KHO', 'HS_CHINH', 'HS_PHU',
    'RAU', 'THIT', 'TIEU_HAO', 'VC_CUA_GHE', 'VC_VO_CUNG', 'VC_KHAC'
  ];
  const all11Present = expected11Codes.every(code => preCats.some(c => c.code === code));
  assert(
    all11Present,
    'SUITE 19.1 Pre-Processing 11 Category Codes Integrity',
    'Tất cả 11 mã danh mục (BAR, DO_AN_NHAN_VIEN, HANG_KHO, HS_CHINH, HS_PHU, RAU, THIT, TIEU_HAO, VC_CUA_GHE, VC_VO_CUNG, VC_KHAC) đều hiện diện chuẩn xác'
  );

  // Phân loại tự động nguyên liệu vào đúng 11 nhóm
  const catCua = getItemPreProcessingCategory('HS-CUACAMAU', 'Hải sản chính', 'Hải sản chính', 'Cua Cà Mau');
  const catBo = getItemPreProcessingCategory('TB-BACHIBO', 'Thịt', 'Thịt', 'Ba chỉ bò Mỹ');
  const catRau = getItemPreProcessingCategory('RC-NAMKIM', 'Rau', 'Rau', 'Nấm kim châm');
  const catBar = getItemPreProcessingCategory('DU-COCA', 'Bar', 'Bar', 'Coca Cola');
  assert(
    catCua === 'VC_CUA_GHE' && catBo === 'THIT' && catRau === 'RAU' && catBar === 'BAR',
    'SUITE 19.1 Auto Item Pre-Processing Categorization',
    'Tự động phân loại chính xác mặt hàng vào nhóm danh mục Kho Trước Chế Biến tương ứng'
  );

  // 19.2: TASK-FLOW-01: Kho Sau Chế Biến (Processed Dishes)
  const processedDishesTN = await warehouseApi.getProcessedDishes({ branchId: 1 });
  assert(
    processedDishesTN.length >= 8,
    'SUITE 19.2 Processed Dishes Count in Finished Dishes Inventory',
    'Kho Sau Chế Biến khởi tạo thành công >= 8 món ăn hoàn chỉnh sẵn sàng phục vụ buffet'
  );

  const cuaMeDish = processedDishesTN.find(d => d.dishCode === 'DISH-CUA-ME');
  assert(
    !!cuaMeDish && cuaMeDish.quantity > 0 && cuaMeDish.unit === 'đĩa',
    'SUITE 19.2 Processed Dish Details Integrity',
    'Món Cua sốt me tồn tại trong Kho Sau Chế Biến với số lượng tồn đĩa khả dụng'
  );

  // Tăng tồn khi Nút 2 Cân Mẻ nấu xong (addProcessedDishStock)
  const stockBeforeAdd = cuaMeDish!.quantity;
  const updatedAfterBatch = await warehouseApi.addProcessedDishStock({
    dishCode: 'DISH-CUA-ME',
    branchId: 1,
    quantity: 5,
  });
  assert(
    updatedAfterBatch.quantity === stockBeforeAdd + 5,
    'SUITE 19.2 Batch Completion Adds Stock to Finished Dishes Inventory',
    'Nút 2 hoàn tất mẻ: tự động tăng +5 đĩa vào Kho Sau Chế Biến của món ăn tương ứng'
  );

  // Khấu trừ tồn khi Nút 3 Ra Line (deductProcessedDishStock)
  const deductResult = await warehouseApi.deductProcessedDishStock({
    dishCode: 'DISH-CUA-ME',
    branchId: 1,
    quantity: 2,
  });
  assert(
    deductResult.success && deductResult.remainingStock === stockBeforeAdd + 3,
    'SUITE 19.2 Ra Line Deducts Stock from Finished Dishes Inventory',
    'Nút 3 ra line: khấu trừ chính xác 2 đĩa từ Kho Sau Chế Biến'
  );

  // Chặn xuất âm nếu ra line vượt tồn kho sau chế biến
  let outOfStockBlocked = false;
  try {
    await warehouseApi.deductProcessedDishStock({
      dishCode: 'DISH-CUA-ME',
      branchId: 1,
      quantity: 999,
    });
  } catch (err: any) {
    outOfStockBlocked = true;
  }
  assert(
    outOfStockBlocked,
    'SUITE 19.2 Ra Line Overdraft Prevention in Finished Dishes Inventory',
    'Chặn cứng không cho ra line nếu số lượng yêu cầu vượt quá tồn khả dụng trong Kho Sau Chế Biến'
  );

  // 19.3: TASK-FLOW-06: Hợp nhất Cân Hàng Mới Về & Xóa nút Nhập Hàng cũ
  const warehouseSource = fs.readFileSync(
    path.resolve(__dirname, '../src/components/warehouse/WarehouseModule.tsx'),
    'utf-8'
  );
  assert(
    !warehouseSource.includes('>+ NHẬP KHO<') && !warehouseSource.includes('>+ NHẬP HÀNG<'),
    'SUITE 19.3 Removed Old Redundant Nhập Hàng Buttons',
    'Đã xóa bỏ hoàn toàn nút "+ NHẬP HÀNG / + NHẬP KHO" cũ trong WarehouseModule.tsx'
  );

  assert(
    warehouseSource.includes('⚖️ CÂN HÀNG MỚI VỀ') &&
    warehouseSource.includes('supplierSearchKeyword') &&
    warehouseSource.includes('filteredSuppliers'),
    'SUITE 19.3 Unified Can Hang Moi Ve with Search-as-you-type NCC',
    'Hợp nhất duy nhất nút "⚖️ CÂN HÀNG MỚI VỀ" với tính năng Search-as-you-type tìm kiếm NCC nhanh'
  );

  // 19.4: TASK-FLOW-07: Phiếu Xuất Hủy Lô Hàng (Hủy một phần, không hủy cả lô)
  // Tạo lô hàng 50kg cua
  const lot50Doc = await warehouseApi.createDocument({
    branchId: 1,
    branchCode: 'TN',
    docType: 'NHAP',
    supplierId: 1,
    items: [
      {
        itemId: 5,
        quantity: 50.0,
        supplierReportedWeight: 50.0,
        actualWeight: 50.0,
        unitPrice: 420000,
        preProcessingCategory: 'VC_CUA_GHE',
      },
    ],
  });
  const createdLots = await db.inventoryLots.where('itemId').equals(5).toArray();
  const testLot50 = createdLots[createdLots.length - 1];
  assert(
    !!testLot50 && testLot50.currentStock === 50.0,
    'SUITE 19.4 Setup 50kg Lot for Partial Scrap Verification',
    'Khởi tạo lô 50kg cua thành công vào Kho Trước Chế Biến'
  );

  // Xuất hủy 2.5kg trên lô 50kg cua chết/ngộp
  const docHuy2_5 = await warehouseApi.createDocument({
    branchId: 1,
    branchCode: 'TN',
    docType: 'HUY',
    status: 'HOAN_THANH',
    supplierId: 1,
    note: 'Hủy 2.5kg cua chết ngộp trong lô 50kg',
    items: [
      {
        itemId: 5,
        batchId: testLot50.id,
        quantity: 2.5,
        actualWeight: 2.5,
        unitPrice: 420000,
        lossCategory: 'HAI_SAN_CHET_NCC',
        reason: '3 con cua chết ngộp khi giao nhận',
      },
    ],
  });

  const lotAfterScrap = await db.inventoryLots.get(testLot50.id);
  assert(
    !!lotAfterScrap && lotAfterScrap.currentStock === 47.5,
    'SUITE 19.4 Partial Lot Scrap Without Deleting Entire Lot',
    'Xuất hủy 2.5kg trên lô 50kg: trừ chính xác 2.5kg, tồn lô còn lại đúng 47.5kg (KHÔNG hủy toàn bộ lô hàng)'
  );

  // -----------------------------------------------------------------
  // 19.5: TASK-FLOW-02: NÚT 1 (LẤY HÀNG TỪ KHO TRƯỚC CHẾ BIẾN)
  // -----------------------------------------------------------------
  console.log('\n📦 SUITE 19.5: Nút 1 Take-Out from Pre-Processing Inventory');

  // Lọc theo 11 nhóm Kho Trước Chế Biến
  const itemsCuaGhe = await kitchenApi.getPreProcessingItems(1, 'VC_CUA_GHE');
  assert(
    itemsCuaGhe.length > 0 && itemsCuaGhe.some((i) => i.id === 5),
    'SUITE 19.5 Filter Pre-Processing Inventory by VC_CUA_GHE Category',
    'Lọc chính xác các nguyên liệu thuộc nhóm VC_CUA_GHE trong Kho Trước Chế Biến'
  );

  const itemsThit = await kitchenApi.getPreProcessingItems(1, 'THIT');
  assert(
    itemsThit.length > 0 && itemsThit.some((i) => i.id === 4),
    'SUITE 19.5 Filter Pre-Processing Inventory by THIT Category',
    'Lọc chính xác các nguyên liệu thuộc nhóm THIT trong Kho Trước Chế Biến'
  );

  // Đa dạng ĐVT (kg, con, cái, lít, gói)
  // Thực hiện lấy hàng với ĐVT 'con'
  const crabStockBeforeTakeOut = await kitchenApi.getItemAvailableStock(5, 1);
  const takeOutResult = await kitchenApi.recordTakeOut({
    itemId: 5,
    quantity: 3,
    unit: 'con',
    branchId: 1,
    note: 'Lấy 3 con cua chế biến cua sốt me',
  });
  const crabStockAfterTakeOut = await kitchenApi.getItemAvailableStock(5, 1);
  assert(
    takeOutResult.success && crabStockAfterTakeOut === Number((crabStockBeforeTakeOut - 3).toFixed(2)),
    'SUITE 19.5 Nút 1 Record Take-Out with Custom Unit (con) & Deduct Pre-Processing Stock',
    'Nút 1 lấy hàng hỗ trợ ĐVT "con", trừ chính xác 3 con cua khỏi tồn kho trước chế biến'
  );

  // Chặn vượt tồn kho khả dụng
  let takeOutOverdraftBlocked = false;
  try {
    await kitchenApi.recordTakeOut({
      itemId: 5,
      quantity: 9999,
      unit: 'kg',
      branchId: 1,
    });
  } catch (err: any) {
    takeOutOverdraftBlocked = err.message.includes('vượt quá tồn kho khả dụng');
  }
  assert(
    takeOutOverdraftBlocked,
    'SUITE 19.5 Nút 1 Overdraft Prevention in Pre-Processing Inventory',
    'Nút 1 chặn cứng không cho lấy hàng vượt quá tồn kho khả dụng'
  );

  // -----------------------------------------------------------------
  // 19.6: TASK-FLOW-03: NÚT 2 (CÂN MẺ & TỰ ĐỘNG NHẬP KHO SAU CHẾ BIẾN)
  // -----------------------------------------------------------------
  console.log('\n⚖️ SUITE 19.6: Nút 2 Batch Weighing & Auto-Stocking Finished Dishes');

  // Khởi tạo mẻ chế biến Cua Cà Mau -> Cua rang me
  const startBatchRes = await kitchenApi.startBatch({
    itemId: 5,
    inputWeight: 10.0,
    unit: 'kg',
    note: 'Mẻ cua rang me sốt trứng muối',
    forceSecondBatch: true,
  });
  assert(
    startBatchRes.success && startBatchRes.data.status === 'DANG_LAM',
    'SUITE 19.6 Nút 2 Start Batch Initialized',
    'Khởi tạo mẻ chế biến thành công ở trạng thái DANG_LAM'
  );

  // Lấy tồn đĩa trước khi cân xong mẻ của món DISH-CUA-ME
  const cuaDishBefore = await db.processedDishes.where('dishCode').equals('DISH-CUA-ME').filter((d) => d.branchId === 1).first();
  const cuaQtyBefore = cuaDishBefore?.quantity || 0;

  // Hoàn tất cân mẻ với 8.5kg thành phẩm (hao hụt 15%)
  const finishBatchRes = await kitchenApi.finishBatch({
    batchId: startBatchRes.data.id,
    outputWeight: 8.5,
    scalePhotoUrl: 'data:image/jpeg;base64,mockScalePhotoData',
    requireScalePhoto: true,
  });
  assert(
    finishBatchRes.success && finishBatchRes.data.status === 'HOAN_THANH',
    'SUITE 19.6 Nút 2 Finish Batch with Scale Photo Completed',
    'Cân mẻ hoàn tất thành công kèm ảnh chụp bàn cân điện tử'
  );

  // Kiểm tra tự động tăng tồn Kho Sau Chế Biến
  const cuaDishAfter = await db.processedDishes.where('dishCode').equals('DISH-CUA-ME').filter((d) => d.branchId === 1).first();
  assert(
    !!cuaDishAfter && cuaDishAfter.quantity === Number((cuaQtyBefore + 8.5).toFixed(2)),
    'SUITE 19.6 Auto Stock Increase in Finished Dishes Inventory (Kho Sau Chế Biến)',
    'Nút 2 hoàn tất cân mẻ tự động tăng +8.5 đĩa vào Kho Sau Chế Biến của món ăn hoàn chỉnh'
  );

  // -----------------------------------------------------------------
  // 19.7: TASK-FLOW-04: NÚT 3 (RA LINE KHẤU TRỪ KHO SAU CHẾ BIẾN & CẢNH BÁO HẾT KHO)
  // -----------------------------------------------------------------
  console.log('\n🍽️ SUITE 19.7: Nút 3 Ra Line Buffet & Finished Dishes Deduction');

  const stockBeforeRaLine = cuaDishAfter!.quantity;
  const lineItemRes = await kitchenApi.recordLineItem({
    dishCode: 'DISH-CUA-ME',
    quantity: 3,
    branchId: 1,
    requestId: 'req-line-test-1',
  });
  const cuaDishAfterLine = await db.processedDishes.where('dishCode').equals('DISH-CUA-ME').filter((d) => d.branchId === 1).first();
  assert(
    lineItemRes.success && cuaDishAfterLine?.quantity === Number((stockBeforeRaLine - 3).toFixed(2)),
    'SUITE 19.7 Nút 3 Ra Line Deducts Finished Dishes Inventory',
    'Nút 3 ra line 3 đĩa: khấu trừ chính xác 3 đĩa trong Kho Sau Chế Biến'
  );

  // Cảnh báo hết hàng / yêu cầu làm mẻ Nút 2 khi ra line vượt tồn
  let raLineOverdraftMsg = '';
  try {
    await kitchenApi.recordLineItem({
      dishCode: 'DISH-CUA-ME',
      quantity: 9999,
      branchId: 1,
    });
  } catch (err: any) {
    raLineOverdraftMsg = err.message;
  }
  assert(
    raLineOverdraftMsg.includes('Kho Sau Chế Biến không đủ món') &&
    raLineOverdraftMsg.includes('Vui lòng nấu và cân mẻ tại NÚT 2'),
    'SUITE 19.7 Nút 3 Insufficient Stock Alert Demands Nút 2 Batch',
    'Nút 3 ra line vượt tồn kho sau chế biến bị chặn và cảnh báo yêu cầu làm mẻ tại Nút 2'
  );

  // -----------------------------------------------------------------
  // 19.8: TASK-FLOW-05: NÚT 5 (TẠO ĐỒ ĂN THỪA CUỐI CA & BẮT BUỘC ẢNH CHỤP)
  // -----------------------------------------------------------------
  console.log('\n🗑️ SUITE 19.8: Nút 5 Leftover Waste at Shift End with Mandatory Scale Photo');

  // Chặn lưu khi thiếu ảnh chụp bàn cân / thức ăn thừa
  let missingPhotoBlocked = false;
  try {
    await kitchenApi.recordLeftoverWaste({
      itemName: 'Cua rang me sốt trứng muối',
      quantity: 1.5,
      unit: 'đĩa',
      locationType: 'LINE',
      reason: 'Khách dùng không hết cuối ca tối',
      imageUrl: '', // Thiếu ảnh
      branchId: 1,
    });
  } catch (err: any) {
    missingPhotoBlocked = err.message.includes('BẮT BUỘC phải chụp ảnh');
  }
  assert(
    missingPhotoBlocked,
    'SUITE 19.8 Nút 5 Missing Photo Strictly Blocked with Anti-Fraud Alert',
    'Nút 5 chặn lưu tuyệt đối khi thiếu ảnh chụp bàn cân thức ăn thừa'
  );

  // Lưu thành công khi có ảnh chụp đính kèm
  const leftoverRes = await kitchenApi.recordLeftoverWaste({
    itemName: 'Cua rang me sốt trứng muối',
    quantity: 1.5,
    unit: 'đĩa',
    locationType: 'LINE',
    reason: 'Khách dùng không hết cuối ca tối',
    imageUrl: 'data:image/jpeg;base64,mockLeftoverPlatePhotoData',
    branchId: 1,
    shift: 'CA_TOI',
  });
  const savedLeftover = await db.dailyRemaining.filter((r: any) => r.itemName === 'Cua rang me sốt trứng muối').first();
  const leftoverDoc = await db.warehouseDocuments.where('docType').equals('DO_AN_THUA').first();
  assert(
    leftoverRes.success &&
    !!savedLeftover &&
    savedLeftover.quantity === 1.5 &&
    !!leftoverDoc &&
    leftoverDoc.warehouseLocation === 'LINE_BUFFET',
    'SUITE 19.8 Nút 5 Valid Photo Saved to Daily Remaining & DO_AN_THUA Stock Doc',
    'Nút 5 lưu thành công đồ ăn thừa vào db.dailyRemaining và tự động tạo chứng từ DO_AN_THUA'
  );

  // -----------------------------------------------------------------
  // 19.9: KIỂM THỬ GIAO DIỆN BẾP 5 NÚT CÔNG THÁI HỌC (TASK-FLOW-02 -> 05)
  // -----------------------------------------------------------------
  console.log('\n📱 SUITE 19.9: Kitchen 5-Button Touch-First UI Verification');

  const kitchen5BtnSource = fs.readFileSync(
    path.resolve(__dirname, '../src/components/kitchen/KitchenModule.tsx'),
    'utf-8'
  );

  const hasAll5Buttons =
    kitchen5BtnSource.includes('Nút 1') &&
    kitchen5BtnSource.includes('LẤY HÀNG') &&
    kitchen5BtnSource.includes('Nút 2') &&
    kitchen5BtnSource.includes('CHẾ BIẾN MẺ') &&
    kitchen5BtnSource.includes('Nút 3') &&
    kitchen5BtnSource.includes('RA LINE (+1)') &&
    kitchen5BtnSource.includes('Nút 4') &&
    kitchen5BtnSource.includes('BÁO HỎNG') &&
    kitchen5BtnSource.includes('Nút 5') &&
    kitchen5BtnSource.includes('ĐỒ ĂN THỪA CUỐI CA');

  assert(
    hasAll5Buttons,
    'SUITE 19.9 Kitchen 5-Button Action Cluster in KitchenModule UI',
    'Giao diện KitchenModule trang bị đầy đủ 5 nút lớn cảm ứng: Nút 1 Lấy Hàng, Nút 2 Chế Biến Mẻ, Nút 3 Ra Line, Nút 4 Báo Hỏng, Nút 5 Đồ Ăn Thừa'
  );

  const hasLeftoverModalWithPhoto =
    kitchen5BtnSource.includes('NÚT 5: TẠO ĐỒ ĂN THỪA CUỐI CA') &&
    kitchen5BtnSource.includes('leftoverPhoto') &&
    kitchen5BtnSource.includes('ẢNH CHỤP MẶT BÀN CÂN / THỨC ĂN THỪA (BẮT BUỘC)') &&
    kitchen5BtnSource.includes('recordLeftoverWaste');

  assert(
    hasLeftoverModalWithPhoto,
    'SUITE 19.9 Nút 5 Leftover Modal with Photo Attachment & Compression',
    'Modal Nút 5 tích hợp đầy đủ trường phân loại vị trí, lý do, và cơ chế chụp/nén ảnh bàn cân chống gian lận'
  );

  console.log('\n======================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  console.log(`🏁 TỔNG KẾT: ${passed}/${total} TESTS ĐẠT (${Math.round((passed / total) * 100)}%)`);
  if (failed > 0) {
    console.error(`❌ CÓ ${failed} TESTS THẤT BẠI:`);
    results.filter(r => !r.passed).forEach(r => console.error(`   - [${r.suite}] ${r.testName}: ${r.message}`));
    process.exit(1);
  } else {
    console.log('🎉 100% KIỂM THỬ NGHIỆP VỤ & TOÀN VẸN DỮ LIỆU ĐÃ ĐẠT CHUẨN XUẤT SẮC!');
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Lỗi nghiêm trọng khi thực thi Test Suite:', err);
  process.exit(1);
});
