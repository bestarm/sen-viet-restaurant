import React, { useState, useEffect } from 'react';
import {
  Wallet,
  FileSpreadsheet,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
  X,
  AlertCircle,
  ShieldCheck,
  DollarSign,
  Building,
  CreditCard,
  Check,
  HelpCircle,
  Lock,
  Unlock,
  ShieldAlert,
  Trash2,
  Info,
  QrCode,
  Copy,
  Search,
  Filter,
  Edit3,
  Calculator,
  Printer,
  LayoutList,
  Rows,
} from 'lucide-react';
import {
  payrollApi,
  SalaryAdvance,
  SalaryIncreaseProposal,
  Payroll,
  PayrollPeriod
} from '../../api/payroll';
import { db } from '../../db/schema';
import { User, RoleName } from '../../types/auth';
import { useNotification } from '../../context/NotificationContext';

interface PayrollModuleProps {
  currentUser?: User | null;
}

export const PayrollModule: React.FC<PayrollModuleProps> = ({ currentUser }) => {
  const { showError, showSuccess, showWarning } = useNotification();
  const [activeTab, setActiveTab] = useState<'payroll' | 'advance' | 'raise' | 'payslip'>('payroll');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [loading, setLoading] = useState(false);
  // TASK-PC-05: Chế độ hiển thị Compact Density Mode (32px vs 48px)
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [message, setInternalMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const setMessage = (msg: { text: string; type: 'success' | 'error' | 'warning' } | null) => {
    setInternalMessage(msg);
    if (!msg) return;
    if (msg.type === 'error') {
      showError(msg.text, 'LỖI BẢNG LƯƠNG & ỨNG LƯƠNG');
    } else if (msg.type === 'warning') {
      showWarning(msg.text, 'CẢNH BÁO BẢNG LƯƠNG');
    } else {
      showSuccess(msg.text, 'THAO TÁC THÀNH CÔNG');
    }
  };

  // Data states
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [myAdvances, setMyAdvances] = useState<SalaryAdvance[]>([]);
  const [proposals, setProposals] = useState<SalaryIncreaseProposal[]>([]);
  const [myPayrolls, setMyPayrolls] = useState<Payroll[]>([]);

  // Advance form state
  const [advanceAmount, setAdvanceAmount] = useState<number>(1500000);
  const [advanceReason, setAdvanceReason] = useState<string>('');

  // Disburse modal state
  const [disbursingAdvance, setDisbursingAdvance] = useState<SalaryAdvance | null>(null);
  const [disbursedAmountInput, setDisbursedAmountInput] = useState<number>(0);
  const [deductionMonthInput, setDeductionMonthInput] = useState<string>('2026-11');
  const [disburseNoteInput, setDisburseNoteInput] = useState<string>('');

  // Payroll lock states (Phase 10)
  const [periodLock, setPeriodLock] = useState<PayrollPeriod | null>(null);
  const [showLockModal, setShowLockModal] = useState<boolean>(false);
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [unlockReasonInput, setUnlockReasonInput] = useState<string>('');

  const isManagerOrAccountant =
    currentUser?.username === 'ketoan_tong' ||
    currentUser?.roles.some((r: RoleName) =>
      [
        'ROLE_RESTAURANT_MANAGER',
        'ROLE_BRANCH_ACCOUNTANT',
        'ROLE_GENERAL_ACCOUNTANT',
        'ROLE_KETOAN_TONG',
        'ROLE_ACCOUNTANT',
      ].includes(r)
    );

  const isGeneralAccountant =
    currentUser?.username === 'ketoan_tong' ||
    currentUser?.roles.some((r: RoleName) =>
      [
        'ROLE_GENERAL_ACCOUNTANT',
        'ROLE_KETOAN_TONG',
        'ROLE_ACCOUNTANT',
        'ROLE_ADMIN',
        'ROLE_CHU_CHUOI',
      ].includes(r)
    );

  const maxAdvanceLimit = 5000000; // Hạn mức ứng tối đa (50% lương cơ bản)

  // Sprint 4: Chi nhánh, tìm kiếm, sửa ngày công bán phần (0.5 công), copy STK
  const [selectedBranch, setSelectedBranch] = useState<number>(0); // 0: Tất cả, 1: TN, 2: QV
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyHalfDays, setOnlyHalfDays] = useState<boolean>(false);
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
  const [workDaysInput, setWorkDaysInput] = useState<number>(26);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [selectedPayslipUserId, setSelectedPayslipUserId] = useState<number>(0);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // TASK-PC-07: Phím tắt F2 hoặc / focus vào ô tìm kiếm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'F2' || e.key === '/') && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenEditWorkDays = (p: Payroll) => {
    setEditingPayroll(p);
    setWorkDaysInput(p.actualWorkDays);
  };

  const handleSaveWorkDays = async () => {
    if (!editingPayroll) return;
    if (workDaysInput < 0 || workDaysInput > 31) {
      showError('Số ngày công không hợp lệ (từ 0 đến 31)');
      return;
    }
    try {
      setLoading(true);
      const updated = await payrollApi.updateWorkDays(editingPayroll.id, workDaysInput);
      setPayrolls((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
      setMessage({
        text: `✅ Đã cập nhật công cho [${editingPayroll.fullName}]: ${workDaysInput} ngày (Thực lĩnh mới: ${updated.netSalary.toLocaleString('vi-VN')} đ)`,
        type: 'success',
      });
      setEditingPayroll(null);
      await loadPayrollData();
    } catch (err: any) {
      setMessage({ text: 'Lỗi khi cập nhật ngày công: ' + (err.message || 'Lỗi hệ thống'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAccount = (acc: string, name: string) => {
    if (!acc) return;
    navigator.clipboard.writeText(acc);
    setCopiedAccount(acc);
    setTimeout(() => setCopiedAccount(null), 2500);
    showSuccess(`Đã sao chép STK [${acc}] của [${name}] vào clipboard!`);
  };

  const getBankColor = (bankName?: string) => {
    const b = (bankName || '').toUpperCase();
    if (b.includes('VIETIN')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (b.includes('MB')) return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    if (b.includes('SHB')) return 'bg-amber-100 text-amber-900 border-amber-300';
    if (b.includes('AGRI')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (b.includes('VIETCOM') || b.includes('VCB')) return 'bg-teal-100 text-teal-800 border-teal-300';
    if (b.includes('TECH')) return 'bg-rose-100 text-rose-800 border-rose-300';
    if (b.includes('BIDV')) return 'bg-cyan-100 text-cyan-800 border-cyan-300';
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  // Tác vụ nhanh: Xác nhận thu hồi đồng phục & Mở khóa chi trả lương (Task 13.6)
  const handleQuickUnlockUniform = async (p: Payroll) => {
    if (!window.confirm(`Xác nhận đã thu hồi 100% đồng phục từ nhân viên [${p.fullName}] và MỞ KHÓA CHI TRẢ LƯƠNG?`)) {
      return;
    }
    try {
      setLoading(true);
      const rec = await db.payrollRecords.get(p.id);
      if (rec) {
        await db.payrollRecords.update(p.id, {
          isUniformRetained: false,
          status: 'DA_DUYET',
          holdReason: undefined,
        });
      }
      const resignations = await db.resignationRequests.where('userId').equals(p.userId).toArray();
      for (const r of resignations) {
        await db.resignationRequests.update(r.id, {
          da_thu_hoi_dong_phuc: true,
          status: 'HOAN_TAT',
          missingUniformDetails: 'Đã thu hồi đủ 100% đồng phục',
        });
      }
      setMessage({
        text: `✅ Đã thu hồi đủ đồng phục và mở khóa chi lương cho nhân viên [${p.fullName}]!`,
        type: 'success',
      });
      await loadPayrollData();
    } catch (err: any) {
      console.error(err);
      setMessage({ text: 'Lỗi khi mở khóa lương: ' + (err.message || 'Lỗi hệ thống'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const isPeriodLocked = periodLock?.status === 'LOCKED' || payrolls.some(p => p.isLocked);

  useEffect(() => {
    loadPayrollData();
    loadAdvanceData();
    loadProposalData();
  }, [selectedMonth, activeTab]);

  const loadPayrollData = async () => {
    try {
      if (isManagerOrAccountant) {
        const [list, periodStatus] = await Promise.all([
          payrollApi.getPayroll(selectedMonth, currentUser?.branchId || undefined),
          payrollApi.getPeriodStatus(selectedMonth, currentUser?.branchId || undefined)
        ]);
        setPayrolls(list);
        setPeriodLock(periodStatus);
      }
      const myList = await payrollApi.getMyPayrolls();
      setMyPayrolls(myList);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadAdvanceData = async () => {
    try {
      if (isManagerOrAccountant) {
        const list = await payrollApi.getAdvances(currentUser?.branchId || undefined);
        setAdvances(list);
      }
      const myList = await payrollApi.getMyAdvances();
      setMyAdvances(myList);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadProposalData = async () => {
    try {
      if (isManagerOrAccountant) {
        const list = await payrollApi.getIncreaseProposals(currentUser?.branchId || undefined);
        setProposals(list);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Lock / Unlock Period Handlers (Phase 10)
  const handleConfirmLock = async () => {
    try {
      setLoading(true);
      const res = await payrollApi.lockPeriod(selectedMonth, currentUser?.branchId || undefined);
      setPeriodLock(res);
      setMessage({
        text: `🔒 Đã chốt & khóa bảng lương tháng ${selectedMonth}. Toàn bộ đơn ứng lương và chi phí tháng này đã được niêm phong!`,
        type: 'success'
      });
      setShowLockModal(false);
      await loadPayrollData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi khi khóa bảng lương', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUnlock = async () => {
    if (!unlockReasonInput.trim()) {
      setMessage({ text: 'Vui lòng nhập lý do mở khóa bảng lương (Bắt buộc theo quy chế kiểm toán)!', type: 'error' });
      return;
    }
    try {
      setLoading(true);
      const res = await payrollApi.unlockPeriod(selectedMonth, unlockReasonInput.trim(), currentUser?.branchId || undefined);
      setPeriodLock(res);
      setMessage({
        text: `🔓 Đã mở khóa bảng lương tháng ${selectedMonth}. Kế toán có thể cập nhật và điều chỉnh.`,
        type: 'success'
      });
      setShowUnlockModal(false);
      setUnlockReasonInput('');
      await loadPayrollData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi khi mở khóa bảng lương', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAdvance = async (advance: SalaryAdvance) => {
    if (isPeriodLocked) {
      setMessage({
        text: `Kỳ lương ${advance.deductionMonth || selectedMonth} đã được chốt và khóa. Không được phép hủy đơn ứng lương!`,
        type: 'error'
      });
      return;
    }
    if (!window.confirm(`Xác nhận hủy đơn ứng lương #${advance.id} của nhân viên [${advance.fullName}]?`)) {
      return;
    }
    try {
      setLoading(true);
      await payrollApi.cancelAdvance(advance.id);
      setMessage({ text: `Đã hủy thành công đơn ứng lương #${advance.id}!`, type: 'success' });
      await loadAdvanceData();
      await handleGeneratePayroll();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi khi hủy đơn ứng lương', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Generate / Recalculate Payroll
  const handleGeneratePayroll = async () => {
    try {
      setLoading(true);
      const list = await payrollApi.generatePayroll(selectedMonth, currentUser?.branchId || undefined);
      setPayrolls(list);
      setMessage({
        text: `Đã tổng hợp tự động bảng lương tháng ${selectedMonth} cho ${list.length} nhân sự!`,
        type: 'success'
      });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi khi tổng hợp bảng lương', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Export Bank Transfer Excel
  const handleExportBankExcel = async () => {
    try {
      setLoading(true);
      const blob = await payrollApi.exportBankExcel(selectedMonth, currentUser?.branchId || undefined);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Lenh_Chi_Ngan_Hang_${selectedMonth}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      setMessage({
        text: `Xuất file lệnh chi chuyển khoản tháng ${selectedMonth} thành công (Đã loại trừ bỏ việc & giữ lương)`,
        type: 'success'
      });
    } catch (err: any) {
      setMessage({ text: 'Lỗi khi xuất file Excel chuyển khoản', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Submit Advance Request
  const handleSubmitAdvance = async () => {
    try {
      setLoading(true);
      const res = await payrollApi.requestAdvance({
        requestedAmount: advanceAmount,
        reason: advanceReason || 'Chi tiêu cá nhân đầu tháng'
      });
      setMessage({
        text: `Đã gửi đơn xin ứng ${res.requestedAmount.toLocaleString('vi-VN')} đ (Mã #${res.id}). Chờ Kế toán duyệt chi.`,
        type: 'success'
      });
      setAdvanceReason('');
      await loadAdvanceData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi gửi đơn ứng lương', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Disburse Advance
  const openDisburseModal = (advance: SalaryAdvance) => {
    setDisbursingAdvance(advance);
    setDisbursedAmountInput(advance.requestedAmount);
    setDeductionMonthInput(selectedMonth);
    setDisburseNoteInput(`Đã duyệt chi ${advance.requestedAmount.toLocaleString('vi-VN')} đ`);
  };

  const handleConfirmDisburse = async () => {
    if (!disbursingAdvance) return;
    try {
      setLoading(true);
      const res = await payrollApi.disburseAdvance(disbursingAdvance.id, {
        disbursedAmount: disbursedAmountInput,
        deductionMonth: deductionMonthInput,
        managerNote: disburseNoteInput
      });
      setMessage({
        text: `Đã duyệt chi ${res.disbursedAmount.toLocaleString('vi-VN')} đ cho ${res.fullName}. Tự động trừ vào lương tháng ${res.deductionMonth}.`,
        type: 'success'
      });
      setDisbursingAdvance(null);
      await loadAdvanceData();
      await handleGeneratePayroll(); // Update payroll numbers
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi khi duyệt chi', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Scan Quarterly Increase Eligibility
  const handleScanIncreases = async () => {
    try {
      setLoading(true);
      const list = await payrollApi.scanIncreases('Q4-2026', currentUser?.branchId || undefined);
      setProposals(list);
      const eligibleCount = list.filter(p => p.isEligible).length;
      setMessage({
        text: `Quét tăng lương Q4-2026 hoàn tất: ${eligibleCount}/${list.length} nhân viên đủ 3 điều kiện đạt chuẩn.`,
        type: eligibleCount > 0 ? 'success' : 'warning'
      });
    } catch (err: any) {
      setMessage({ text: 'Lỗi khi quét tăng lương', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Approve Increase
  const handleApproveIncrease = async (proposal: SalaryIncreaseProposal) => {
    try {
      setLoading(true);
      const res = await payrollApi.approveIncrease(proposal.id);
      setMessage({
        text: `Đã duyệt tăng lương +${res.raiseAmount.toLocaleString('vi-VN')} đ cho ${res.fullName}! Lương cơ bản đã được cộng trực tiếp.`,
        type: 'success'
      });
      await loadProposalData();
      await handleGeneratePayroll();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi duyệt tăng lương', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations & Filtered List
  const filteredPayrolls = payrolls.filter((p) => {
    if (selectedBranch !== 0 && p.branchId !== selectedBranch) return false;
    if (onlyHalfDays && p.actualWorkDays % 1 === 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = p.fullName.toLowerCase().includes(q);
      const matchUser = p.username.toLowerCase().includes(q);
      const matchBank = (p.bankName || '').toLowerCase().includes(q);
      const matchAcc = (p.bankAccountNumber || '').toLowerCase().includes(q);
      const matchPos = (p.position || '').toLowerCase().includes(q);
      if (!matchName && !matchUser && !matchBank && !matchAcc && !matchPos) return false;
    }
    return true;
  });

  const totalNetSalary = payrolls.reduce((sum, p) => {
    if (p.status === 'BO_VIEC' || p.isAbandoned || p.excludedFromCost) {
      return sum;
    }
    return sum + (p.netSalary || 0);
  }, 0);
  const totalAdvances = payrolls.reduce((sum, p) => sum + (p.advanceDeduction || 0), 0);
  const totalPenalties = payrolls.reduce((sum, p) => sum + (p.penaltyDeduction || 0), 0);
  const halfDaysCount = payrolls.filter((p) => p.actualWorkDays % 1 !== 0).length;
  const blockedCount = payrolls.filter((p) => p.status === 'BO_VIEC' || p.status === 'DANG_GIU_LUONG' || p.isUniformRetained).length;

  // Tổng lương không trả do bỏ việc (đã tách khỏi chi phí P&L)
  const totalUnpaidAbandonedSalary = payrolls
    .filter((p) => p.status === 'BO_VIEC' || p.isAbandoned || p.excludedFromCost)
    .reduce((sum, p) => {
      const standardDays = p.standardWorkDays || 26;
      const basePlusRaise = (p.baseSalary || 0) + (p.salaryRaise || 0);
      const nominalSalary = standardDays > 0 ? (basePlusRaise * (p.actualWorkDays || 0)) / standardDays : 0;
      return sum + Math.round(nominalSalary);
    }, 0);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Title & Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-7 h-7 text-emerald-600" />
              Phân Hệ Quản Trị Tiền Lương & Ứng Lương Tự Động
            </h1>
            {isPeriodLocked && (
              <span className="px-2.5 py-1 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black rounded-lg flex items-center gap-1 shadow-sm">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                [ĐÃ KHÓA]
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Tự động khấu trừ tạm ứng, tiền phạt vi phạm ca, tăng lương sát hạch, khóa lương bỏ việc và xuất file chuyển khoản ngân hàng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-sm text-sm">
            <span className="text-xs text-slate-500 font-semibold">Tháng:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="border-none bg-transparent font-bold text-slate-800 focus:outline-none"
            />
          </div>

          {isManagerOrAccountant && (
            <>
              <button
                onClick={handleGeneratePayroll}
                disabled={loading}
                className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Tổng Hợp Lương
              </button>

              <button
                onClick={handleExportBankExcel}
                disabled={loading}
                className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" /> Xuất File Ngân Hàng
              </button>
            </>
          )}

          {isGeneralAccountant && (
            <>
              {!isPeriodLocked ? (
                <button
                  onClick={() => setShowLockModal(true)}
                  disabled={loading}
                  title="Chốt và khóa bảng lương kỳ này, niêm phong toàn bộ sửa/hủy đơn ứng lương"
                  className="py-2 px-3.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                >
                  <Lock className="w-3.5 h-3.5" /> Chốt & Khóa Lương
                </button>
              ) : (
                <button
                  onClick={() => setShowUnlockModal(true)}
                  disabled={loading}
                  title="Mở khóa kỳ lương để điều chỉnh (Bắt buộc nhập lý do kiểm toán)"
                  className="py-2 px-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                >
                  <Unlock className="w-3.5 h-3.5" /> Mở Khóa Lương
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Prominent Period Locked Banner */}
      {isPeriodLocked && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-950 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm uppercase tracking-wide text-amber-900">
                  KỲ BẢNG LƯƠNG THÁNG {selectedMonth} ĐÃ ĐƯỢC CHỐT VÀ KHÓA
                </span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-black rounded-full uppercase">
                  Niêm Phong Kiểm Toán
                </span>
              </div>
              <div className="text-xs text-amber-800 mt-0.5">
                {periodLock?.lockedAt
                  ? `Đã khóa lúc ${new Date(periodLock.lockedAt).toLocaleString('vi-VN')} bởi ${periodLock.lockedByUsername || 'Kế toán tổng'}. Toàn bộ thao tác sửa/hủy đơn ứng lương tháng này đã bị niêm phong.`
                  : 'Toàn bộ thao tác sửa/hủy đơn ứng lương tháng này đã bị vô hiệu hóa theo quy chế kiểm toán.'}
              </div>
            </div>
          </div>
          {isGeneralAccountant && (
            <button
              onClick={() => setShowUnlockModal(true)}
              className="px-4 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto transition-colors"
            >
              <Unlock className="w-3.5 h-3.5 text-amber-700" />
              Mở Khóa Bảng Lương
            </button>
          )}
        </div>
      )}

      {/* Global Alert Message */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-sm transition-all ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : message.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border border-amber-300'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {message.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {message.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
            {message.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span className="font-medium text-sm">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      {isManagerOrAccountant && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Quỹ Lương Thực Chi</div>
              <div className="text-base font-bold text-emerald-700">
                {totalNetSalary.toLocaleString('vi-VN')} đ
              </div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Số Lượng Nhân Sự</div>
              <div className="text-base font-bold text-slate-900">{payrolls.length} người</div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Tạm Ứng Đã Trừ</div>
              <div className="text-base font-bold text-amber-700">
                {totalAdvances.toLocaleString('vi-VN')} đ
              </div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Phạt Vi Phạm Đã Trừ</div>
              <div className="text-base font-bold text-rose-700">
                {totalPenalties.toLocaleString('vi-VN')} đ
              </div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Công Bán Phần (0.5)</div>
              <div className="text-base font-bold text-teal-700">
                {halfDaysCount} nhân sự
              </div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Khóa / Giữ Lương</div>
              <div className="text-base font-bold text-purple-700">
                {blockedCount} nhân sự
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        {isManagerOrAccountant && (
          <button
            onClick={() => setActiveTab('payroll')}
            className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm border-b-2 transition-all ${
              activeTab === 'payroll'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Bảng Lương Tháng {selectedMonth}
          </button>
        )}

        <button
          onClick={() => setActiveTab('advance')}
          className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'advance'
              ? 'border-amber-600 text-amber-600 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Ứng Lương & Duyệt Chi
        </button>

        {isManagerOrAccountant && (
          <button
            onClick={() => setActiveTab('raise')}
            className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm border-b-2 transition-all ${
              activeTab === 'raise'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Xét Tăng Lương Quý
          </button>
        )}

        <button
          onClick={() => setActiveTab('payslip')}
          className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'payslip'
              ? 'border-purple-600 text-purple-600 bg-purple-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Phiếu Lương Cá Nhân
        </button>
      </div>

      {/* TAB 1: MASTER PAYROLL TABLE */}
      {activeTab === 'payroll' && isManagerOrAccountant && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Bảng Lương Chi Tiết Tháng {selectedMonth}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Công thức: <strong className="text-emerald-700 font-semibold">Thực lĩnh = Lương công + Chuyên cần + Trách nhiệm - Bảo hiểm - Ứng lương - Tiền phạt</strong>
              </p>
            </div>

            {/* Filter toolbar: Chi nhánh, tìm kiếm, toggle 0.5 công */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(Number(e.target.value))}
                  className="bg-transparent font-bold text-slate-700 border-none focus:outline-none"
                >
                  <option value={0}>Tất cả chi nhánh ({payrolls.length})</option>
                  <option value={1}>Chi nhánh Thái Nguyên ({payrolls.filter(p => p.branchId === 1).length})</option>
                  <option value={2}>Chi nhánh Quế Võ ({payrolls.filter(p => p.branchId === 2).length})</option>
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Tìm tên, STK, ngân hàng... (F2)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs w-44 focus:w-56 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setOnlyHalfDays(!onlyHalfDays)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  onlyHalfDays
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Chỉ xem 0.5 công ({halfDaysCount})</span>
              </button>

              {/* TASK-PC-05: Density toggle (32px compact vs 48px comfortable) */}
              <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDensity('comfortable')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    density === 'comfortable'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Chế độ hiển thị tiêu chuẩn (48px)"
                >
                  <Rows className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tiêu chuẩn</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDensity('compact')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    density === 'compact'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Chế độ hiển thị cô đọng (32px)"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cô đọng</span>
                </button>
              </div>

              {/* TASK-PC-08: In ấn khổ A4 Landscape */}
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                title="In Bảng lương khổ A4 Landscape (Ctrl+P)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">In Bảng Lương A4</span>
              </button>
            </div>
          </div>

          {/* TASK-PC-08: Header in ấn chuẩn A4 Landscape */}
          <div className="hidden print:block mb-4 text-center">
            <h1 className="text-sm font-black uppercase tracking-wider text-slate-900">
              CÔNG TY T&T NGUYỄN DƯƠNG — HỆ THỐNG BUFFET SEN VIỆT
            </h1>
            <h2 className="text-base font-bold text-slate-800 mt-1">
              BẢNG THANH TOÁN LƯƠNG NHÂN VIÊN — THÁNG {selectedMonth}
            </h2>
            <p className="text-xs text-slate-500 italic mt-0.5">
              Thời gian xuất biểu: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN')}
            </p>
          </div>

          {/* TASK-PC-04: Freeze Columns & Sticky Header */}
          <div className="overflow-x-auto max-h-[calc(100vh-270px)] relative border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-30 bg-slate-50 text-slate-600 uppercase border-b border-slate-200 shadow-sm">
                <tr>
                  <th className={`sticky left-0 z-40 bg-slate-100 ${density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-3'} w-12 text-center`}>STT</th>
                  <th className={`sticky left-12 z-40 bg-slate-100 ${density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-3'} min-w-[190px] border-r border-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>Nhân viên</th>
                  <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-3'}`}>Ngân hàng & STK</th>
                  <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-3'} text-right`}>Lương CB</th>
                  <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-3'} text-center`}>Ngày công</th>
                  <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-3'} text-right`}>Lương công</th>
                  <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-3'} text-right`}>Chuyên cần</th>
                  <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-3'} text-right`}>Trách nhiệm</th>
                  <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-3'} text-right`}>BHXH</th>
                  <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-3'} text-right`}>Ứng lương</th>
                  <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-3'} text-right`}>Tiền phạt</th>
                  <th className={`${density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-3'} text-right font-bold text-slate-900`}>Thực lĩnh</th>
                  <th className={`sticky right-0 z-40 bg-slate-100 ${density === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-3'} shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] text-right`}>Trạng thái / Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayrolls.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-slate-400">
                      Không tìm thấy nhân sự phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredPayrolls.map((p, idx) => {
                    const isAbnormal = p.status === 'BO_VIEC' || p.isAbandoned || p.excludedFromCost;
                    const isHold = p.status === 'DANG_GIU_LUONG' || p.isUniformRetained;
                    const cellPy = density === 'compact' ? 'py-1.5 px-2.5 text-xs' : 'py-3 px-3 text-sm';

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-50 transition-colors group ${
                          isAbnormal
                            ? 'bg-slate-100/90 text-slate-500'
                            : isHold
                            ? 'bg-rose-50/50'
                            : ''
                        }`}
                      >
                        <td
                          className={`sticky left-0 z-20 w-12 text-center font-mono ${cellPy} ${
                            isAbnormal
                              ? 'bg-slate-100 text-slate-500'
                              : isHold
                              ? 'bg-rose-50 text-slate-600'
                              : 'bg-white group-hover:bg-slate-50 text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </td>
                        <td
                          className={`sticky left-12 z-20 min-w-[190px] border-r border-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${cellPy} ${
                            isAbnormal
                              ? 'bg-slate-100'
                              : isHold
                              ? 'bg-rose-50'
                              : 'bg-white group-hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-semibold text-slate-900">{p.fullName}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <span>@{p.username}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                              {p.position || 'Nhân viên'}
                            </span>
                          </div>
                        </td>
                        <td className={`${cellPy} font-mono`}>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBankColor(p.bankName)}`}>
                              {p.bankName || 'Vietcombank'}
                            </span>
                          </div>
                          <div className="text-slate-900 font-bold flex items-center gap-1 mt-0.5">
                            <span>{p.bankAccountNumber || '—'}</span>
                            {p.bankAccountNumber && (
                              <button
                                type="button"
                                onClick={() => handleCopyAccount(p.bankAccountNumber!, p.fullName)}
                                title="Sao chép số tài khoản"
                                className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors"
                              >
                                {copiedAccount === p.bankAccountNumber ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className={`${cellPy} text-right font-medium text-slate-700`}>
                          {p.baseSalary.toLocaleString('vi-VN')} đ
                        </td>
                        <td className={`${cellPy} text-center`}>
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-extrabold text-slate-900">
                              {p.actualWorkDays}
                            </span>
                            <span className="text-[11px] text-slate-400">/{p.standardWorkDays}</span>
                            <button
                              type="button"
                              onClick={() => handleOpenEditWorkDays(p)}
                              title="Chỉnh sửa chấm công (hỗ trợ 0.5 công / nửa ca)"
                              className="p-1 hover:bg-slate-200 text-slate-500 rounded transition-colors"
                            >
                              <Edit3 className="w-3 h-3 text-blue-600" />
                            </button>
                          </div>
                          {p.actualWorkDays % 1 !== 0 && (
                            <span className="inline-block px-1.5 py-0.2 bg-teal-100 border border-teal-300 text-teal-800 text-[9px] font-bold rounded-full mt-0.5">
                              +0.5 công
                            </span>
                          )}
                        </td>
                        <td className={`${cellPy} text-right font-semibold text-slate-800`}>
                          {(p.workSalary || Math.round((p.baseSalary / p.standardWorkDays) * p.actualWorkDays)).toLocaleString('vi-VN')} đ
                        </td>
                        <td className={`${cellPy} text-right text-emerald-600 font-semibold`}>
                          {(p.attendanceBonus || 0) > 0 ? `+${(p.attendanceBonus || 0).toLocaleString('vi-VN')} đ` : '—'}
                        </td>
                        <td className={`${cellPy} text-right text-blue-600 font-semibold`}>
                          {(p.responsibilityAllowance || p.allowance || 0) > 0
                            ? `+${(p.responsibilityAllowance || p.allowance || 0).toLocaleString('vi-VN')} đ`
                            : '—'}
                        </td>
                        <td className={`${cellPy} text-right text-purple-700 font-semibold`}>
                          {(p.insuranceDeduction || 0) > 0 ? `-${(p.insuranceDeduction || 0).toLocaleString('vi-VN')} đ` : '—'}
                        </td>
                        <td className={`${cellPy} text-right text-amber-600 font-semibold`}>
                          {(p.advanceDeduction || 0) > 0 ? `-${(p.advanceDeduction || 0).toLocaleString('vi-VN')} đ` : '—'}
                        </td>
                        <td className={`${cellPy} text-right text-rose-600 font-semibold`}>
                          {(p.penaltyDeduction || 0) > 0 ? `-${(p.penaltyDeduction || 0).toLocaleString('vi-VN')} đ` : '—'}
                        </td>
                        <td className={`${cellPy} text-right font-mono font-bold ${density === 'compact' ? 'text-xs' : 'text-sm'}`}>
                          {isAbnormal ? (
                            <div className="flex flex-col items-end">
                              <span className="text-slate-400 line-through">0 đ</span>
                              <span className="text-[10px] text-slate-400 font-normal">Tách khỏi chi phí</span>
                            </div>
                          ) : (
                            <span
                              className={
                                isHold
                                  ? 'text-rose-600 font-black'
                                  : 'text-emerald-700 font-black'
                              }
                            >
                              {p.netSalary.toLocaleString('vi-VN')} đ
                            </span>
                          )}
                        </td>
                        <td
                          className={`sticky right-0 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] ${cellPy} ${
                            isAbnormal
                              ? 'bg-slate-100'
                              : isHold
                              ? 'bg-rose-50'
                              : 'bg-white group-hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                                isAbnormal
                                  ? 'bg-slate-200 text-slate-800'
                                  : isHold
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                  : p.isLocked
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isAbnormal
                                ? 'BỎ VIỆC (LƯƠNG = 0)'
                                : isHold
                                ? 'TẠM KHÓA CHI LƯƠNG'
                                : p.isLocked
                                ? 'ĐÃ KHÓA'
                                : 'Đã duyệt'}
                            </span>

                            {isHold && isManagerOrAccountant && (
                              <button
                                type="button"
                                onClick={() => handleQuickUnlockUniform(p)}
                                className="btn-touch mt-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Thu hồi & Mở khóa</span>
                              </button>
                            )}
                            {isAbnormal && (
                              <span className="text-[10px] text-rose-600 font-semibold italic">
                                Bỏ việc — không trả theo quy định
                              </span>
                            )}
                            {p.holdReason && isHold && (
                              <span className="text-[10px] text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                {p.holdReason}
                              </span>
                            )}
                            {p.note && !isAbnormal && (
                              <span className="text-[10px] text-slate-500 italic">{p.note}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 4 Ô CHỮ KÝ CHUẨN A4 LANDSCAPE (TASK-PC-08) */}
          <div className="hidden print:grid grid-cols-4 gap-4 mt-8 pt-4 border-t border-slate-300 text-center text-xs print-avoid-break">
            <div className="space-y-1">
              <span className="font-bold block uppercase text-slate-800">Người Lập Biểu</span>
              <span className="text-[10px] text-slate-500 italic block">(Ký, ghi rõ họ tên)</span>
              <div className="h-16" />
              <span className="font-bold text-slate-700">Kế toán tiền lương</span>
            </div>
            <div className="space-y-1">
              <span className="font-bold block uppercase text-slate-800">Quản Lý Cơ Sở</span>
              <span className="text-[10px] text-slate-500 italic block">(Ký, ghi rõ họ tên)</span>
              <div className="h-16" />
              <span className="font-bold text-slate-700">Giám đốc chi nhánh</span>
            </div>
            <div className="space-y-1">
              <span className="font-bold block uppercase text-slate-800">Kế Toán Trưởng</span>
              <span className="text-[10px] text-slate-500 italic block">(Ký, ghi rõ họ tên)</span>
              <div className="h-16" />
              <span className="font-bold text-slate-700">Vũ Thủy</span>
            </div>
            <div className="space-y-1">
              <span className="font-bold block uppercase text-slate-800">Tổng Giám Đốc</span>
              <span className="text-[10px] text-slate-500 italic block">(Ký, đóng dấu)</span>
              <div className="h-16" />
              <span className="font-bold text-slate-700">Ban Điều Hành Sen Việt</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALARY ADVANCES */}
      {activeTab === 'advance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Employee Request Form */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-600" />
              Nộp Đơn Xin Ứng Lương
            </h2>
            <p className="text-xs text-slate-500">
              Quy chế: Mỗi nhân viên được ứng tối đa 50% lương cơ bản trong tháng. Số tiền được Kế toán duyệt chi sẽ tự động trừ vào bảng lương đợt gần nhất.
            </p>

            <div className="space-y-4 pt-2">
              {/* Thanh Slider & Thanh Tiến Độ Hạn Mức Tối Đa (Task 13.6) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Số Tiền Xin Ứng:
                  </label>
                  <span className="font-mono text-xl font-black text-amber-700">
                    {advanceAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min={500000}
                  max={maxAdvanceLimit}
                  step={100000}
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />

                {/* Thanh tiến độ hạn mức tối đa */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Hạn mức ứng đã chọn:</span>
                    <span className="font-bold text-slate-700">
                      {Math.round((advanceAmount / maxAdvanceLimit) * 100)}% (Tối đa: {maxAdvanceLimit.toLocaleString('vi-VN')} đ)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        advanceAmount / maxAdvanceLimit > 0.8
                          ? 'bg-rose-500'
                          : advanceAmount / maxAdvanceLimit > 0.5
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(advanceAmount / maxAdvanceLimit) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Phím chọn nhanh */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Mức nhanh:</span>
                  {[500000, 1000000, 2000000, 3000000, 5000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAdvanceAmount(amt)}
                      className={`btn-touch px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        advanceAmount === amt
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {amt === 5000000 ? 'Tối đa (5tr)' : `${amt / 1000000}tr`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý Do Xin Ứng Lương:
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Đóng tiền trọ đầu tháng, gia đình có việc phát sinh..."
                  value={advanceReason}
                  onChange={(e) => setAdvanceReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={handleSubmitAdvance}
                disabled={loading}
                className="btn-touch w-full min-h-[48px] py-3 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-xl font-extrabold text-sm shadow-lg shadow-amber-600/25 transition-all"
              >
                Gửi Đơn Xin Ứng Lương ({advanceAmount.toLocaleString('vi-VN')} đ)
              </button>
            </div>

            {/* My Advance History */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h3 className="text-xs font-bold uppercase text-slate-500">Lịch Sử Xin Ứng Của Tôi</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {myAdvances.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">Bạn chưa gửi đơn ứng lương nào.</p>
                ) : (
                  myAdvances.map(a => (
                    <div key={a.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900">{a.requestedAmount.toLocaleString('vi-VN')} đ</div>
                        <div className="text-[11px] text-slate-500">{a.requestDate} • {a.reason}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        a.status === 'DA_CHI' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {a.status === 'DA_CHI' ? 'Đã chi' : 'Chờ duyệt'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Manager / Accountant Approval List */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Duyệt Chi Ứng Lương Chi Nhánh
              </h2>
              <button onClick={loadAdvanceData} className="text-xs text-blue-600 hover:underline">
                Làm mới
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                    <th className="py-2 px-3">Nhân viên</th>
                    <th className="py-2 px-3">Ngày xin</th>
                    <th className="py-2 px-3 text-right">Xin ứng</th>
                    <th className="py-2 px-3 text-right">Thực chi</th>
                    <th className="py-2 px-3">Trừ lương</th>
                    <th className="py-2 px-3">Trạng thái</th>
                    <th className="py-2 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {advances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        Không có đơn ứng lương nào.
                      </td>
                    </tr>
                  ) : (
                    advances.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {a.fullName}
                          <div className="text-[10px] text-slate-400">@{a.username}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{a.requestDate}</td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {a.requestedAmount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          {a.disbursedAmount > 0 ? `${a.disbursedAmount.toLocaleString('vi-VN')} đ` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">
                          {a.deductionMonth || 'Chưa định'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              a.status === 'DA_CHI' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {a.status === 'DA_CHI' ? 'Đã chi trả' : 'Chờ duyệt'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isManagerOrAccountant && (
                            <div className="flex justify-end gap-1.5 items-center">
                              {a.status !== 'DA_CHI' && (
                                <button
                                  onClick={() => openDisburseModal(a)}
                                  disabled={isPeriodLocked}
                                  title={isPeriodLocked ? `Kỳ lương ${selectedMonth} đã khóa - Không thể duyệt chi` : 'Duyệt chi ứng lương'}
                                  className={`py-1 px-3 rounded-lg text-xs font-semibold shadow transition-all ${
                                    isPeriodLocked
                                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                                  }`}
                                >
                                  {isPeriodLocked ? 'Đã Khóa' : 'Duyệt Chi'}
                                </button>
                              )}
                              <button
                                onClick={() => handleCancelAdvance(a)}
                                disabled={isPeriodLocked}
                                title={isPeriodLocked ? `Kỳ lương ${a.deductionMonth || selectedMonth} đã khóa - Không thể hủy đơn` : 'Hủy đơn ứng lương'}
                                className={`p-1 rounded-lg text-xs border transition-all ${
                                  isPeriodLocked
                                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                                    : 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SALARY RAISE EVALUATION */}
      {activeTab === 'raise' && isManagerOrAccountant && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Xét Tăng Lương Định Kỳ (Quý 4/2026)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thuật toán tự động quét 3 tiêu chuẩn: Điểm thi ≥ 80 đ + Đi muộn ≤ 3 lần + Nghỉ không phép = 0.
              </p>
            </div>
            <button
              onClick={handleScanIncreases}
              disabled={loading}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Quét Điều Kiện Tăng Lương
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                  <th className="py-2.5 px-3">Nhân viên</th>
                  <th className="py-2.5 px-3 text-center">Kỳ thi</th>
                  <th className="py-2.5 px-3 text-center">Điểm thi quý</th>
                  <th className="py-2.5 px-3 text-center">Đi muộn (90 ngày)</th>
                  <th className="py-2.5 px-3">Đánh giá điều kiện</th>
                  <th className="py-2.5 px-3 text-right">Mức tăng</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proposals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">
                      Chưa có dữ liệu đề xuất tăng lương. Nhấn "Quét Điều Kiện Tăng Lương" để chạy thuật toán.
                    </td>
                  </tr>
                ) : (
                  proposals.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {p.fullName}
                        <div className="text-[10px] text-slate-400">@{p.username}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{p.examQuarter}</td>
                      <td className="py-3 px-3 text-center font-bold">
                        <span className={p.examScore >= 80 ? 'text-emerald-600' : 'text-slate-500'}>
                          {p.examScore} / 100
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={p.lateCount <= 3 ? 'text-emerald-600' : 'text-rose-600 font-bold'}>
                          {p.lateCount} lần
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            p.isEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.isEligible ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {p.isEligible ? 'ĐỦ ĐIỀU KIỆN' : 'CHƯA ĐỦ ĐIỀU KIỆN'}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{p.evaluationDetails}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-700">
                        +{p.raiseAmount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'DA_DUYET'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status === 'DA_DUYET' ? 'Đã duyệt tăng' : 'Chờ duyệt'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {p.isEligible && p.status !== 'DA_DUYET' && (
                          <button
                            onClick={() => handleApproveIncrease(p)}
                            className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow"
                          >
                            Duyệt Tăng
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PERSONAL PAYSLIP (DIGITAL RECEIPT STYLE - TASK 13.6 & SPRINT 4) */}
      {activeTab === 'payslip' && (
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Employee selector for managers / accountants */}
          {isManagerOrAccountant && payrolls.length > 0 && (
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-purple-600" />
                Xem phiếu lương nhân viên:
              </span>
              <select
                value={selectedPayslipUserId}
                onChange={(e) => setSelectedPayslipUserId(Number(e.target.value))}
                className="text-xs font-semibold p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 max-w-md"
              >
                <option value={0}>-- Chọn nhân sự (Mặc định: Tất cả {payrolls.length} nhân viên) --</option>
                {payrolls.map((p) => (
                  <option key={p.id} value={p.userId}>
                    {p.fullName} - {p.position || 'Nhân viên'} ({p.branchName}) - STK: {p.bankAccountNumber} ({p.bankName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {(() => {
            const displayList = isManagerOrAccountant
              ? selectedPayslipUserId !== 0
                ? payrolls.filter((p) => p.userId === selectedPayslipUserId)
                : payrolls
              : myPayrolls;

            if (displayList.length === 0) {
              return (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                  <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold">Chưa có dữ liệu phiếu lương cho nhân sự này trong tháng {selectedMonth}.</p>
                </div>
              );
            }

            return displayList.map((p) => {
              const isBlocked = p.status === 'DANG_GIU_LUONG' || p.isUniformRetained;
              const isAbandoned = p.status === 'BO_VIEC' || p.isAbandoned || p.excludedFromCost;
              const workSalary = p.workSalary || Math.round((p.baseSalary / p.standardWorkDays) * p.actualWorkDays);
              const attendanceBonus = p.attendanceBonus || 0;
              const responsibilityAllowance = p.responsibilityAllowance || p.allowance || 0;
              const insuranceDeduction = p.insuranceDeduction || 0;
              const advanceDeduction = p.advanceDeduction || 0;
              const penaltyDeduction = p.penaltyDeduction || 0;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden relative"
                >
                  {/* Perforated Top Header Pattern */}
                  <div className="bg-slate-900 text-white p-6 pb-5 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center font-black text-white text-base shadow">
                          SV
                        </div>
                        <div>
                          <div className="font-black text-sm uppercase tracking-wider text-red-400">
                            SEN VIỆT BUFFET
                          </div>
                          <div className="text-xs text-slate-300 font-medium">
                            {p.branchName || currentUser?.branchName || 'Chi nhánh Thái Nguyên'}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-white/10 text-slate-200 border border-white/20">
                        Tháng {selectedMonth}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Nhân viên thụ hưởng</div>
                        <div className="font-extrabold text-base text-white">{p.fullName}</div>
                        <div className="text-[11px] text-slate-300 font-medium">{p.position || 'Nhân viên'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Mã NV / Username</div>
                        <div className="font-mono font-bold text-slate-200">@{p.username}</div>
                        <div className="text-[11px] text-slate-400 font-mono">ID #{p.userId}</div>
                      </div>
                    </div>

                    {/* Dấu Stamp Trạng Thái Receipt */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                        BIÊN LAI LƯƠNG ĐIỆN TỬ #REC-{p.id}-2026
                      </span>
                      <span
                        className={`px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-sm ${
                          isAbandoned
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : isBlocked
                            ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        }`}
                      >
                        {isAbandoned
                          ? 'BỎ VIỆC (LƯƠNG = 0)'
                          : isBlocked
                          ? '🔒 TẠM KHÓA CHI LƯƠNG'
                          : '✓ ĐÃ PHÊ DUYỆT CHI TRẢ'}
                      </span>
                    </div>
                  </div>

                  {/* Warning Callout nếu bị khóa đồng phục */}
                  {isBlocked && (
                    <div className="p-3.5 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-rose-600 flex-shrink-0 animate-pulse" />
                      <span>
                        <strong>Tạm giữ lương:</strong> {p.holdReason || 'Nhân viên nghỉ việc chưa bàn giao đủ 100% đồng phục. Liên hệ Quản lý chi nhánh để hoàn tất thủ tục.'}
                      </span>
                    </div>
                  )}

                  {/* Receipt Items Breakdown (Đầy đủ chi tiết khấu trừ theo quy chuẩn) */}
                  <div className="p-6 space-y-3 font-mono text-xs sm:text-sm">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-sans font-medium">1. Lương cơ bản (Lương cứng):</span>
                      <strong className="text-slate-900">{p.baseSalary.toLocaleString('vi-VN')} đ</strong>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-sans font-medium">2. Ngày công chuẩn & thực tế:</span>
                      <div className="text-right">
                        <strong className="text-slate-900">{p.actualWorkDays} / {p.standardWorkDays} ngày</strong>
                        {p.actualWorkDays % 1 !== 0 && (
                          <div className="text-[10px] text-teal-700 font-sans font-semibold">
                            (Bao gồm 0.5 công bán phần / nửa ca)
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <span className="font-sans font-medium">3. Lương theo ngày công:</span>
                      <strong className="text-slate-900 font-bold">{workSalary.toLocaleString('vi-VN')} đ</strong>
                    </div>

                    <div className="flex justify-between items-center text-emerald-800 bg-emerald-50/50 p-2 rounded-xl border border-emerald-200">
                      <span className="font-sans font-medium">4. Thưởng chuyên cần & sát hạch:</span>
                      <strong className="text-emerald-700 font-bold">
                        {attendanceBonus > 0 ? `+${attendanceBonus.toLocaleString('vi-VN')} đ` : '0 đ'}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center text-blue-800 bg-blue-50/50 p-2 rounded-xl border border-blue-200">
                      <span className="font-sans font-medium">5. Phụ cấp trách nhiệm / chức vụ:</span>
                      <strong className="text-blue-700 font-bold">
                        {responsibilityAllowance > 0 ? `+${responsibilityAllowance.toLocaleString('vi-VN')} đ` : '0 đ'}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center text-purple-900 bg-purple-50/70 p-2 rounded-xl border border-purple-200">
                      <span className="font-sans font-bold">6. Khấu trừ bảo hiểm xã hội (BHXH):</span>
                      <strong className="text-purple-700 font-black">
                        {insuranceDeduction > 0 ? `-${insuranceDeduction.toLocaleString('vi-VN')} đ` : '0 đ'}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center text-amber-900 bg-amber-50/70 p-2 rounded-xl border border-amber-200">
                      <span className="font-sans font-bold">7. Khấu trừ tạm ứng lương:</span>
                      <strong className="text-amber-700 font-black">
                        {advanceDeduction > 0 ? `-${advanceDeduction.toLocaleString('vi-VN')} đ` : '0 đ'}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center text-rose-900 bg-rose-50/70 p-2 rounded-xl border border-rose-200">
                      <span className="font-sans font-bold">8. Khấu trừ vi phạm ca / kỷ luật:</span>
                      <strong className="text-rose-700 font-black">
                        {penaltyDeduction > 0 ? `-${penaltyDeduction.toLocaleString('vi-VN')} đ` : '0 đ'}
                      </strong>
                    </div>

                    {/* Dashed line delimiter */}
                    <div className="border-b-2 border-dashed border-slate-300 my-3" />

                    {/* Total Net Salary */}
                    <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 flex items-center justify-between shadow-sm">
                      <div>
                        <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-emerald-800">
                          THỰC LĨNH CHUYỂN KHOẢN
                        </div>
                        <div className="text-[10px] text-slate-500 font-sans">
                          {isAbandoned
                            ? 'Tách khỏi chi phí theo quy định'
                            : 'Thực lĩnh = Lương công + Chuyên cần + Trách nhiệm - BHXH - Ứng lương - Phạt'}
                        </div>
                      </div>
                      <div className="font-mono text-2xl font-black text-emerald-700">
                        {isAbandoned ? '0 đ' : `${p.netSalary.toLocaleString('vi-VN')} đ`}
                      </div>
                    </div>

                    {/* Banking details */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-sans space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Tài khoản ngân hàng thụ hưởng nhận lương:
                      </div>
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getBankColor(p.bankName)}`}>
                            {p.bankName || 'Vietcombank'}
                          </span>
                          <span className="font-mono text-sm">{p.bankAccountNumber || 'Chưa cập nhật'}</span>
                          {p.bankAccountNumber && (
                            <button
                              type="button"
                              onClick={() => handleCopyAccount(p.bankAccountNumber!, p.fullName)}
                              title="Sao chép số tài khoản"
                              className="text-slate-400 hover:text-blue-600 p-0.5"
                            >
                              {copiedAccount === p.bankAccountNumber ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                        <span className="font-semibold text-slate-600 text-xs">
                          Chủ TK: {p.bankAccountHolder || p.fullName.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Barcode & Security footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-sans">
                      <div className="flex items-center gap-1.5">
                        <QrCode className="h-4 w-4 text-slate-500" />
                        <span>Xác thực số: SHA256-SVB-{p.id}</span>
                      </div>
                      <span>Sen Việt ERP • Payslip Generator</span>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* MODAL: Chỉnh Sửa Chấm Công (Hỗ Trợ 0.5 Công / Nửa Ca - TASK-S4-03) */}
      {editingPayroll && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                Chấm Công Bán Phần (0.5 công / nửa ca)
              </h3>
              <button
                type="button"
                onClick={() => setEditingPayroll(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <div className="font-bold text-slate-900 text-sm">{editingPayroll.fullName}</div>
              <div className="text-slate-500 flex items-center gap-2">
                <span>@{editingPayroll.username}</span>
                <span>•</span>
                <span>{editingPayroll.position || 'Nhân viên'}</span>
                <span>•</span>
                <span>{editingPayroll.branchName}</span>
              </div>
              <div className="text-slate-600 pt-1">
                Lương CB: <strong>{editingPayroll.baseSalary.toLocaleString('vi-VN')} đ</strong> (Công chuẩn: {editingPayroll.standardWorkDays} ngày)
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Số Ngày Công Thực Tế Trong Tháng (hỗ trợ số lẻ 0.5):
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="31"
                  value={workDaysInput}
                  onChange={(e) => setWorkDaysInput(Number(e.target.value))}
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-lg font-black text-slate-900 text-center focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-xs font-bold text-slate-500">công</span>
              </div>

              {/* Nút bấm chọn nhanh */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Chọn nhanh:</span>
                <button
                  type="button"
                  onClick={() => setWorkDaysInput((prev) => Math.min(31, Number((prev + 0.5).toFixed(1))))}
                  className="px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200"
                >
                  +0.5 công (Nửa ca)
                </button>
                <button
                  type="button"
                  onClick={() => setWorkDaysInput((prev) => Math.max(0, Number((prev - 0.5).toFixed(1))))}
                  className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200"
                >
                  -0.5 công
                </button>
                <button
                  type="button"
                  onClick={() => setWorkDaysInput((prev) => Math.min(31, Number((prev + 1).toFixed(1))))}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  +1.0 ca
                </button>
                <button
                  type="button"
                  onClick={() => setWorkDaysInput(26)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Đủ 26 công
                </button>
              </div>

              {/* Live Preview Box */}
              {(() => {
                const std = editingPayroll.standardWorkDays || 26;
                const dSalary = Math.round(editingPayroll.baseSalary / std);
                const wSalary = Math.round(dSalary * workDaysInput);
                const att = editingPayroll.attendanceBonus || 0;
                const resp = editingPayroll.responsibilityAllowance || editingPayroll.allowance || 0;
                const ins = editingPayroll.insuranceDeduction || 0;
                const adv = editingPayroll.advanceDeduction || 0;
                const pen = editingPayroll.penaltyDeduction || 0;
                const estNet = Math.max(0, Math.round(wSalary + att + resp - ins - adv - pen));

                return (
                  <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200 text-xs space-y-1 text-teal-950 font-mono">
                    <div className="flex justify-between">
                      <span className="font-sans">Lương 1 ngày công:</span>
                      <strong>{dSalary.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans">Lương theo {workDaysInput} ngày:</span>
                      <strong className="text-teal-800">{wSalary.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-teal-200 text-sm">
                      <span className="font-sans font-bold text-teal-900">Thực lĩnh ước tính:</span>
                      <strong className="text-teal-700 text-base font-black">{estNet.toLocaleString('vi-VN')} đ</strong>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPayroll(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveWorkDays}
                disabled={loading}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-extrabold text-xs shadow-md transition-all"
              >
                Lưu & Cập Nhật Lương
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Disburse Advance */}
      {disbursingAdvance && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-600" />
              Duyệt Chi Ứng Lương: {disbursingAdvance.fullName}
            </h3>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs space-y-1 text-amber-950">
              <div>Số tiền xin ứng: <strong>{disbursingAdvance.requestedAmount.toLocaleString('vi-VN')} đ</strong></div>
              <div>Lý do: "{disbursingAdvance.reason}"</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số Tiền Thực Chi (VNĐ):
              </label>
              <input
                type="number"
                min={0}
                max={disbursingAdvance.requestedAmount}
                value={disbursedAmountInput}
                onChange={e => setDisbursedAmountInput(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tháng Khấu Trừ Bảng Lương (YYYY-MM):
              </label>
              <input
                type="month"
                value={deductionMonthInput}
                onChange={e => setDeductionMonthInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Duyệt Chi:</label>
              <input
                type="text"
                value={disburseNoteInput}
                onChange={e => setDisburseNoteInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDisbursingAdvance(null)}
                className="py-2 px-4 text-slate-600 hover:text-slate-800 text-sm font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDisburse}
                disabled={loading}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow"
              >
                Xác Nhận Duyệt Chi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Lock Payroll Period (Phase 10) */}
      {showLockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">
                Chốt & Khóa Bảng Lương Tháng {selectedMonth}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Hành động dành riêng cho Kế Toán Tổng / Ban Lãnh Đạo
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 space-y-2 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                Quy chế niêm phong tài chính:
              </div>
              <p>
                Sau khi khóa, kỳ bảng lương tháng <strong>{selectedMonth}</strong> sẽ được niêm phong cho công tác kế toán & kiểm toán.
              </p>
              <p className="font-semibold text-rose-950">
                Toàn bộ thao tác chỉnh sửa hoặc hủy đơn ứng lương của tháng này sẽ bị hệ thống từ chối (HTTP 400).
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowLockModal(false)}
                className="py-2.5 px-4 text-slate-600 hover:text-slate-800 text-sm font-semibold rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmLock}
                disabled={loading}
                className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Xác Nhận Khóa Bảng Lương
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Unlock Payroll Period (Phase 10) */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
              <Unlock className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">
                Mở Khóa Bảng Lương Tháng {selectedMonth}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Hành động dành riêng cho Kế Toán Tổng / Ban Lãnh Đạo
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                Quy chế kiểm toán & audit trail:
              </div>
              <p>
                Bắt buộc nhập lý do mở khóa. Thao tác này sẽ được ghi lại trong nhật ký hệ thống để phục vụ đối soát.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lý Do Mở Khóa (Bắt buộc):
              </label>
              <textarea
                rows={3}
                value={unlockReasonInput}
                onChange={e => setUnlockReasonInput(e.target.value)}
                placeholder="Ví dụ: Bổ sung ngày công và điều chỉnh tạm ứng cho nhân viên bếp theo đơn khiếu nại..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  setUnlockReasonInput('');
                }}
                className="py-2.5 px-4 text-slate-600 hover:text-slate-800 text-sm font-semibold rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmUnlock}
                disabled={loading || !unlockReasonInput.trim()}
                className="py-2.5 px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow flex items-center gap-2 disabled:opacity-50"
              >
                <Unlock className="w-4 h-4" />
                Xác Nhận Mở Khóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PayrollModule;
