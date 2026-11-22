import * as XLSX from 'xlsx';
import { db } from '../db/schema';
import { simulateLatency, initializeDatabaseIfEmpty } from '../db/dbService';

export interface SalaryAdvance {
  id: number;
  userId: number;
  fullName: string;
  username: string;
  branchId?: number;
  branchName?: string;
  requestDate: string;
  requestedAmount: number;
  reason: string;
  disbursedAmount: number;
  deductionMonth?: string;
  status: string; // 'CHO_DUYET', 'DA_DUYET', 'DA_CHI', 'TU_CHOI'
  approvedByName?: string;
  approvedAt?: string;
  managerNote?: string;
}

export interface SalaryAdvanceRequest {
  requestedAmount: number;
  reason: string;
}

export interface DisburseAdvanceRequest {
  disbursedAmount: number;
  deductionMonth: string;
  managerNote?: string;
}

export interface UpdateAdvanceRequest {
  requestedAmount?: number;
  disbursedAmount?: number;
  reason?: string;
  deductionMonth?: string;
  managerNote?: string;
}

export interface PayrollPeriod {
  id?: number;
  periodMonth: string;
  branchId?: number;
  branchName?: string;
  status: 'OPEN' | 'LOCKED';
  lockedAt?: string;
  lockedByUsername?: string;
  unlockReason?: string;
}

export interface Payroll {
  id: number;
  userId: number;
  fullName: string;
  username: string;
  position?: string;
  branchId?: number;
  branchName?: string;
  payrollMonth: string;
  baseSalary: number;
  standardWorkDays: number;
  actualWorkDays: number;
  dailySalary?: number;
  workSalary?: number;
  salaryRaise: number;
  attendanceBonus?: number;
  responsibilityAllowance?: number;
  allowance: number;
  grossSalary: number;
  insuranceDeduction?: number;
  advanceDeduction: number;
  penaltyDeduction: number;
  netSalary: number;
  status: string; // 'CHO_DUYET', 'DA_DUYET', 'DANG_GIU_LUONG', 'BO_VIEC', 'DA_THANH_TOAN', 'LOCKED'
  isAbandoned: boolean;
  isUniformRetained: boolean;
  excludedFromCost?: boolean;
  holdReason?: string;
  isLocked?: boolean;
  lockedAt?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  note?: string;
}

export interface PayrollSummary {
  periodMonth: string;
  branchId?: number;
  branchName?: string;
  periodStatus: 'OPEN' | 'LOCKED';
  totalBranchCost: number;
  totalUnpaidAbandonedSalary: number;
  totalEmployees: number;
  abandonedCount: number;
  uniformRetainedCount: number;
  payrolls: Payroll[];
}

export interface SalaryIncreaseProposal {
  id: number;
  userId: number;
  fullName: string;
  username: string;
  branchId?: number;
  branchName?: string;
  examQuarter: string;
  examScore: number;
  lateCount: number;
  unexcusedAbsenceCount: number;
  isEligible: boolean;
  raiseAmount: number;
  status: string; // 'CHO_DUYET', 'DA_DUYET', 'TU_CHOI'
  evaluationDetails?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
}

export const payrollApi = {
  // 1. Quản lý Ứng lương
  requestAdvance: async (data: SalaryAdvanceRequest): Promise<SalaryAdvance> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 180);

    const savedUserId = Number(localStorage.getItem('senviet_demo_user_id') || 1);
    const user = (await db.users.get(savedUserId)) || (await db.users.get(1));
    const now = new Date();

    const newAdvance: SalaryAdvance = {
      id: Date.now(),
      userId: user?.id || 1,
      fullName: user?.fullName || 'Nguyễn Văn Bếp',
      username: user?.username || 'bep_tn',
      branchId: user?.branchId || 1,
      branchName: user?.branchName || 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      requestDate: now.toISOString().slice(0, 10),
      requestedAmount: data.requestedAmount,
      reason: data.reason,
      disbursedAmount: 0,
      deductionMonth: now.toISOString().slice(0, 7),
      status: 'CHO_DUYET',
    };

    await db.salaryAdvances.add(newAdvance);
    return newAdvance;
  },

  getMyAdvances: async (): Promise<SalaryAdvance[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const savedUserId = Number(localStorage.getItem('senviet_demo_user_id') || 1);
    const list = await db.salaryAdvances.toArray();
    return list.filter((a) => a.userId === savedUserId).reverse();
  },

  getBranchAdvances: async (branchId?: number): Promise<SalaryAdvance[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    let list = await db.salaryAdvances.toArray();
    if (branchId) {
      list = list.filter((a) => a.branchId === branchId);
    }
    return list.reverse();
  },

  getAdvances: async (branchId?: number): Promise<SalaryAdvance[]> => {
    return payrollApi.getBranchAdvances(branchId);
  },

  disburseAdvance: async (id: number, data: DisburseAdvanceRequest): Promise<SalaryAdvance> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 160);

    const existing = await db.salaryAdvances.get(id);
    if (!existing) throw new Error('Không tìm thấy đơn ứng lương');

    const updated: SalaryAdvance = {
      ...existing,
      disbursedAmount: data.disbursedAmount,
      deductionMonth: data.deductionMonth,
      managerNote: data.managerNote,
      status: 'DA_CHI',
      approvedByName: 'Lê Hoàng Quản Lý',
      approvedAt: new Date().toISOString().slice(0, 10),
    };

    await db.salaryAdvances.put(updated);
    return updated;
  },

  updateAdvance: async (id: number, data: UpdateAdvanceRequest): Promise<SalaryAdvance> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);

    const existing = await db.salaryAdvances.get(id);
    if (!existing) throw new Error('Không tìm thấy đơn ứng lương');

    const updated: SalaryAdvance = {
      ...existing,
      ...data,
    };

    await db.salaryAdvances.put(updated);
    return updated;
  },

  cancelAdvance: async (id: number): Promise<void> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);

    const existing = await db.salaryAdvances.get(id);
    if (existing) {
      await db.salaryAdvances.put({ ...existing, status: 'TU_CHOI' });
    }
  },

  // 1.1 Khóa / Mở Khóa Bảng Lương (Payroll Period Lock)
  lockPeriod: async (periodMonth: string, branchId?: number): Promise<PayrollPeriod> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 180);

    const list = await db.payrollPeriods.toArray();
    const existing = list.find((p) => p.periodMonth === periodMonth);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const updated: PayrollPeriod = {
      id: existing ? existing.id : Date.now(),
      periodMonth,
      branchId: branchId || 1,
      branchName: 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      status: 'LOCKED',
      lockedAt: now,
      lockedByUsername: 'ketoan_tong',
    };

    if (existing) {
      await db.payrollPeriods.put(updated);
    } else {
      await db.payrollPeriods.add(updated);
    }

    return updated;
  },

  unlockPeriod: async (periodMonth: string, reason: string, branchId?: number): Promise<PayrollPeriod> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 180);

    const list = await db.payrollPeriods.toArray();
    const existing = list.find((p) => p.periodMonth === periodMonth);

    const updated: PayrollPeriod = {
      id: existing ? existing.id : Date.now(),
      periodMonth,
      branchId: branchId || 1,
      branchName: 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      status: 'OPEN',
      unlockReason: reason,
    };

    if (existing) {
      await db.payrollPeriods.put(updated);
    } else {
      await db.payrollPeriods.add(updated);
    }

    return updated;
  },

  getPeriodStatus: async (periodMonth: string, branchId?: number): Promise<PayrollPeriod | null> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const list = await db.payrollPeriods.toArray();
    const match = list.find((p) => p.periodMonth === periodMonth && (!branchId || p.branchId === branchId));
    return match || null;
  },

  getPayrollSummary: async (month?: string, branchId?: number): Promise<PayrollSummary | null> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const periodMonth = month || '2026-10';
    const payrolls = await payrollApi.getPayroll(periodMonth, branchId);
    const period = await payrollApi.getPeriodStatus(periodMonth, branchId);

    const totalBranchCost = payrolls
      .filter((p) => !p.excludedFromCost)
      .reduce((sum, p) => sum + p.netSalary, 0);

    const totalUnpaidAbandonedSalary = payrolls
      .filter((p) => p.isAbandoned)
      .reduce((sum, p) => sum + p.netSalary, 0);

    const abandonedCount = payrolls.filter((p) => p.isAbandoned).length;
    const uniformRetainedCount = payrolls.filter((p) => p.isUniformRetained).length;

    return {
      periodMonth,
      branchId: branchId || 1,
      branchName: branchId === 2 ? 'Sen Việt Buffet - Chi nhánh Quế Võ' : 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      periodStatus: period?.status === 'LOCKED' ? 'LOCKED' : 'OPEN',
      totalBranchCost,
      totalUnpaidAbandonedSalary,
      totalEmployees: payrolls.length,
      abandonedCount,
      uniformRetainedCount,
      payrolls,
    };
  },

  // 2. Xét tăng lương quý
  scanIncreases: async (quarter = 'Q4-2026', branchId?: number): Promise<SalaryIncreaseProposal[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 180);

    return [
      {
        id: 1,
        userId: 1,
        fullName: 'Nguyễn Văn Bếp',
        username: 'bep_tn',
        branchId: branchId || 1,
        branchName: 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
        examQuarter: quarter,
        examScore: 96,
        lateCount: 0,
        unexcusedAbsenceCount: 0,
        isEligible: true,
        raiseAmount: 1000000,
        status: 'CHO_DUYET',
        evaluationDetails: 'Đạt điểm lý thuyết 100/100, thực hành 92/100. Đi làm đầy đủ không vi phạm.',
        createdAt: '2026-11-15',
      },
    ];
  },

  getIncreaseProposals: async (branchId?: number): Promise<SalaryIncreaseProposal[]> => {
    return payrollApi.scanIncreases('Q4-2026', branchId);
  },

  approveIncrease: async (id: number): Promise<SalaryIncreaseProposal> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);

    return {
      id,
      userId: 1,
      fullName: 'Nguyễn Văn Bếp',
      username: 'bep_tn',
      branchId: 1,
      branchName: 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      examQuarter: 'Q4-2026',
      examScore: 96,
      lateCount: 0,
      unexcusedAbsenceCount: 0,
      isEligible: true,
      raiseAmount: 1000000,
      status: 'DA_DUYET',
      evaluationDetails: 'Đạt điểm thi xuất sắc, đã duyệt tăng lương',
      approvedByName: 'Lê Hoàng Quản Lý',
      approvedAt: new Date().toISOString().slice(0, 10),
      createdAt: '2026-11-15',
    };
  },

  // 3. Bảng lương tổng hợp & Chuyển khoản
  generatePayroll: async (month?: string, branchId?: number): Promise<Payroll[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(140, 220);

    const m = month || '2026-11';
    return await payrollApi.getPayroll(m, branchId);
  },

  getPayroll: async (month?: string, branchId?: number): Promise<Payroll[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const m = month || '2026-11';
    let list = await db.payrollRecords.toArray();

    // Lọc theo tháng nếu được yêu cầu và có dữ liệu tương ứng
    if (month) {
      const monthFiltered = list.filter((p) => p.month === month || p.payrollMonth === month);
      if (monthFiltered.length > 0) {
        list = monthFiltered;
      }
    }

    // Tải danh sách đơn ứng lương đã chi (status === 'DA_CHI')
    const advances = await db.salaryAdvances.toArray();
    const disbursedAdvances = advances.filter((a) => a.status === 'DA_CHI');

    // Tải danh sách biên bản phạt ca từ Quản lý chi nhánh
    let shiftPenalties: any[] = [];
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('senviet_penalties');
        if (raw) shiftPenalties = JSON.parse(raw);
      }
    } catch (e) {
      shiftPenalties = [];
    }

    // Map fields to match Payroll interface exactly
    const mapped: Payroll[] = list.map((p) => {
      const isRetained = p.userId === 10 || p.holdReason?.includes('đồng phục') || p.isUniformRetained;
      const isAband = (p.userId === 10 || p.status === 'BO_VIEC') && !isRetained;

      // 1. Số ngày công chuẩn & thực tế (hỗ trợ bán phần 0.5 công / nửa ca)
      const standardWorkDays = p.workDays || p.standardWorkDays || 26;
      const actualWorkDays = typeof p.actualWorkDays === 'number' ? p.actualWorkDays : standardWorkDays;

      // 2. Lương cơ bản & Lương theo ngày công: workSalary = dailySalary * actualWorkDays
      const baseSalary = p.baseSalary || 8500000;
      const dailySalary = p.dailySalary || Math.round(baseSalary / standardWorkDays);
      const workSalary = p.workSalary !== undefined ? p.workSalary : Math.round(dailySalary * actualWorkDays);

      // 3. Khấu trừ ứng lương tự động từ phân hệ ứng lương
      const matchedAdvances = disbursedAdvances.filter(
        (a) => a.userId === p.userId || a.username === p.username || a.fullName?.trim().toLowerCase() === p.fullName?.trim().toLowerCase()
      );
      const totalAdvanceFromModule = matchedAdvances.reduce((sum, a) => sum + (a.disbursedAmount || 0), 0);
      const advanceDeduction = p.advanceDeduction > 0 ? p.advanceDeduction : totalAdvanceFromModule;

      // 4. Khấu trừ tiền phạt vi phạm ca từ Quản lý chi nhánh
      const matchedPenalties = shiftPenalties.filter(
        (pen) => pen.employeeName?.trim().toLowerCase() === p.fullName?.trim().toLowerCase() && pen.isDeductedFromSalary
      );
      const totalPenaltyFromManager = matchedPenalties.reduce((sum, pen) => sum + (pen.fineAmount || 0), 0);
      const penaltyDeduction = p.penaltyDeduction > 0 ? p.penaltyDeduction : totalPenaltyFromManager > 0 ? totalPenaltyFromManager : (p.deductions || 0);

      // 5. Thưởng chuyên cần & Phụ cấp trách nhiệm
      let attendanceBonus = p.attendanceBonus !== undefined ? p.attendanceBonus : (p.bonus || 0);
      if (attendanceBonus === 0 && actualWorkDays >= standardWorkDays && penaltyDeduction === 0 && !isAband) {
        attendanceBonus = 300000;
      }

      let responsibilityAllowance = p.responsibilityAllowance !== undefined ? p.responsibilityAllowance : (p.allowance || 0);
      if (responsibilityAllowance === 0) {
        const pos = (p.position || '').toLowerCase();
        if (pos.includes('bếp trưởng') || pos.includes('quản lý')) {
          responsibilityAllowance = 2000000;
        } else if (pos.includes('bếp phó') || pos.includes('tổ trưởng')) {
          responsibilityAllowance = 600000;
        }
      }

      // 6. Bảo hiểm xã hội
      const insuranceDeduction = p.insuranceDeduction !== undefined ? p.insuranceDeduction : (p.insuranceAmount || 0);

      // 7. CÔNG THỨC CHUẨN THỰC LĨNH:
      // Thực lĩnh = Lương công + Chuyên cần + Trách nhiệm - Bảo hiểm - Ứng lương - Tiền phạt
      let netSalary = p.netSalary;
      if (isAband) {
        netSalary = 0;
      } else if (!netSalary || p.recalculated || advanceDeduction > 0 || penaltyDeduction > 0) {
        netSalary = Math.max(
          0,
          Math.round(workSalary + attendanceBonus + responsibilityAllowance - insuranceDeduction - advanceDeduction - penaltyDeduction)
        );
      }

      return {
        id: p.id,
        userId: p.userId,
        fullName: p.fullName,
        username: p.username,
        position: p.position || 'Nhân viên',
        branchId: p.branchId || 1,
        branchName: p.branchName || (p.branchId === 2 ? 'Sen Việt Buffet - Chi nhánh Quế Võ' : 'Sen Việt Buffet - Chi nhánh Thái Nguyên'),
        payrollMonth: p.month || p.payrollMonth || m,
        baseSalary,
        standardWorkDays,
        actualWorkDays,
        dailySalary,
        workSalary,
        salaryRaise: p.salaryRaise || 0,
        attendanceBonus,
        responsibilityAllowance,
        allowance: responsibilityAllowance,
        grossSalary: (p.baseSalary || 8500000) + responsibilityAllowance + attendanceBonus,
        insuranceDeduction,
        advanceDeduction,
        penaltyDeduction,
        netSalary,
        status: isRetained ? 'DANG_GIU_LUONG' : isAband ? 'BO_VIEC' : p.isPaid ? 'DA_THANH_TOAN' : 'CHO_DUYET',
        isAbandoned: isAband,
        isUniformRetained: isRetained,
        excludedFromCost: isAband,
        holdReason: isRetained ? (p.holdReason || '🔒 Chưa thu hồi đồng phục (thiếu 1 Tạp dề, 1 Nón bếp)') : undefined,
        isLocked: p.isLocked !== undefined ? p.isLocked : (m === '2026-10'),
        bankName: p.bankName || 'Vietcombank',
        bankAccountNumber: p.bankAccount || p.bankAccountNumber || `101${p.userId}888999`,
        bankAccountHolder: p.bankAccountHolder || p.fullName.toUpperCase(),
        note: isRetained ? 'Giữ lương theo quy định thu hồi đồng phục' : p.note,
      };
    });

    if (branchId) {
      return mapped.filter((p) => p.branchId === branchId);
    }
    return mapped;
  },

  updateWorkDays: async (payrollId: number, actualWorkDays: number): Promise<Payroll> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const existing = await db.payrollRecords.get(payrollId);
    if (!existing) throw new Error('Không tìm thấy bản ghi lương');

    const standardWorkDays = existing.workDays || existing.standardWorkDays || 26;
    const baseSalary = existing.baseSalary || 8500000;
    const dailySalary = Math.round(baseSalary / standardWorkDays);
    const workSalary = Math.round(dailySalary * actualWorkDays);
    const attendanceBonus = existing.attendanceBonus !== undefined ? existing.attendanceBonus : (existing.bonus || 0);
    const responsibilityAllowance = existing.responsibilityAllowance !== undefined ? existing.responsibilityAllowance : (existing.allowance || 0);
    const insuranceDeduction = existing.insuranceDeduction || 0;
    const advanceDeduction = existing.advanceDeduction || 0;
    const penaltyDeduction = existing.penaltyDeduction || existing.deductions || 0;

    const netSalary = existing.status === 'BO_VIEC'
      ? 0
      : Math.max(0, Math.round(workSalary + attendanceBonus + responsibilityAllowance - insuranceDeduction - advanceDeduction - penaltyDeduction));

    const updated = {
      ...existing,
      actualWorkDays,
      dailySalary,
      workSalary,
      netSalary,
      recalculated: true,
    };

    await db.payrollRecords.put(updated);
    return updated as Payroll;
  },

  updatePenalty: async (payrollId: number, penaltyDeduction: number): Promise<Payroll> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const existing = await db.payrollRecords.get(payrollId);
    if (!existing) throw new Error('Không tìm thấy bản ghi lương');

    const standardWorkDays = existing.workDays || existing.standardWorkDays || 26;
    const actualWorkDays = existing.actualWorkDays || standardWorkDays;
    const baseSalary = existing.baseSalary || 8500000;
    const dailySalary = Math.round(baseSalary / standardWorkDays);
    const workSalary = Math.round(dailySalary * actualWorkDays);
    const attendanceBonus = existing.attendanceBonus !== undefined ? existing.attendanceBonus : (existing.bonus || 0);
    const responsibilityAllowance = existing.responsibilityAllowance !== undefined ? existing.responsibilityAllowance : (existing.allowance || 0);
    const insuranceDeduction = existing.insuranceDeduction || 0;
    const advanceDeduction = existing.advanceDeduction || 0;

    const netSalary = existing.status === 'BO_VIEC'
      ? 0
      : Math.max(0, Math.round(workSalary + attendanceBonus + responsibilityAllowance - insuranceDeduction - advanceDeduction - penaltyDeduction));

    const updated = {
      ...existing,
      penaltyDeduction,
      netSalary,
      recalculated: true,
    };

    await db.payrollRecords.put(updated);
    return updated as Payroll;
  },

  getMyPayrolls: async (): Promise<Payroll[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const savedUserId = Number(localStorage.getItem('senviet_demo_user_id') || 1);
    const list = await payrollApi.getPayroll();
    const userPayrolls = list.filter((p) => p.userId === savedUserId);
    if (userPayrolls.length > 0) return userPayrolls;
    return list.slice(0, 1);
  },

  exportBankExcel: async (month: string, branchId?: number): Promise<Blob> => {
    await simulateLatency(80, 120);
    const list = await payrollApi.getPayroll(month, branchId);

    const wb = XLSX.utils.book_new();
    const header = [
      'STT',
      'Mã NV',
      'Họ và tên',
      'Chức vụ',
      'Chi nhánh',
      'Tên Ngân hàng',
      'Số tài khoản',
      'Chủ tài khoản',
      'Lương cơ bản (đ)',
      'Ngày công thực tế',
      'Lương theo ngày công (đ)',
      'Thưởng chuyên cần (đ)',
      'Phụ cấp trách nhiệm (đ)',
      'Khấu trừ BHXH (đ)',
      'Khấu trừ ứng lương (đ)',
      'Khấu trừ tiền phạt vi phạm (đ)',
      'Thực lĩnh chuyển khoản (đ)',
      'Trạng thái chuyển khoản',
      'Ghi chú',
    ];

    const rows = list.map((p, idx) => [
      idx + 1,
      p.username,
      p.fullName,
      p.position || 'Nhân viên',
      p.branchName,
      p.bankName || 'Vietcombank',
      p.bankAccountNumber || '',
      p.bankAccountHolder || p.fullName.toUpperCase(),
      p.baseSalary,
      p.actualWorkDays,
      p.workSalary || Math.round((p.baseSalary / p.standardWorkDays) * p.actualWorkDays),
      p.attendanceBonus || 0,
      p.responsibilityAllowance || p.allowance || 0,
      p.insuranceDeduction || 0,
      p.advanceDeduction || 0,
      p.penaltyDeduction || 0,
      p.netSalary,
      p.status === 'DA_THANH_TOAN' ? 'ĐÃ CHI TRẢ' : p.isUniformRetained ? 'TẠM KHÓA GIỮ ĐỒNG PHỤC' : p.isAbandoned ? 'BỎ VIỆC (LƯƠNG = 0)' : 'CHỜ DUYỆT CHI',
      p.holdReason || p.note || (p.actualWorkDays % 1 !== 0 ? 'Bao gồm 0.5 công bán phần' : ''),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, `Lenh_Chi_Ngan_Hang_${month}`);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    return new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },
};
