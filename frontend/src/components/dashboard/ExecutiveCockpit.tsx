import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { db } from '../../db/schema';
import {
  Crown,
  TrendingUp,
  AlertTriangle,
  Building2,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Calendar,
  MapPin,
  Clock,
  Award,
  AlertOctagon,
  Scale,
  RefreshCw,
  ChevronRight,
  FileSpreadsheet,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';

export interface SalaryProposal {
  id: number;
  userId: number;
  fullName: string;
  position?: string;
  branchId: number;
  branchName: string;
  quarter: string;
  currentSalary: number;
  proposedSalary: number;
  examScore: number;
  status: 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI';
  reason: string;
  directorNote?: string;
  decidedAt?: string;
}

const INITIAL_PROPOSALS: SalaryProposal[] = [
  {
    id: 1,
    userId: 1,
    fullName: 'Nguyễn Văn Bếp',
    position: 'Bếp viên chính (Khu Hải Sản)',
    branchId: 1,
    branchName: 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
    quarter: 'Q4-2026',
    currentSalary: 8500000,
    proposedSalary: 9500000,
    examScore: 96,
    status: 'CHO_DUYET',
    reason: 'Đạt điểm thi lý thuyết & thực hành tay nghề dao thớt 96/100, giữ tỷ lệ hao hụt mẻ dưới 3.8%',
  },
  {
    id: 2,
    userId: 8,
    fullName: 'Nguyễn Bá Hoan',
    position: 'Bếp trưởng cơ sở Quế Võ',
    branchId: 2,
    branchName: 'Sen Việt Buffet - Chi nhánh Quế Võ',
    quarter: 'Q4-2026',
    currentSalary: 12000000,
    proposedSalary: 13500000,
    examScore: 98,
    status: 'CHO_DUYET',
    reason: 'Quản lý Cost thực phẩm Quế Võ đạt 45.4% (thấp nhất toàn chuỗi), không để xảy ra sự cố VSATTP',
  },
  {
    id: 3,
    userId: 9,
    fullName: 'Vũ Thị Thu Ngân',
    position: 'Trưởng ca Thu Ngân',
    branchId: 1,
    branchName: 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
    quarter: 'Q4-2026',
    currentSalary: 7200000,
    proposedSalary: 8000000,
    examScore: 95,
    status: 'CHO_DUYET',
    reason: 'Đối soát hóa đơn CukCuk 18 ngày khớp 100%, không lệch tiền mặt, đạt chuyên cần xuất sắc',
  },
  {
    id: 4,
    userId: 10,
    fullName: 'Phạm Tuấn Nam',
    position: 'Tổ trưởng Phục Vụ Bàn',
    branchId: 2,
    branchName: 'Sen Việt Buffet - Chi nhánh Quế Võ',
    quarter: 'Q4-2026',
    currentSalary: 6500000,
    proposedSalary: 7300000,
    examScore: 92,
    status: 'CHO_DUYET',
    reason: 'Đào tạo 6 nhân viên mới đạt chuẩn bài thi quy trình buffet, đánh giá hài lòng khách hàng 4.9/5',
  },
];

export const ExecutiveCockpit: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [proposals, setProposals] = useState<SalaryProposal[]>(() => {
    const saved = localStorage.getItem('senviet_salary_proposals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_PROPOSALS;
      }
    }
    return INITIAL_PROPOSALS;
  });

  const [filterProposalStatus, setFilterProposalStatus] = useState<string>('ALL');
  const [selectedProposal, setSelectedProposal] = useState<SalaryProposal | null>(null);
  const [directorNoteInput, setDirectorNoteInput] = useState<string>('');
  const [activeAction, setActiveAction] = useState<'APPROVE' | 'REJECT' | null>(null);

  // Lưu state proposals vào localStorage
  useEffect(() => {
    localStorage.setItem('senviet_salary_proposals', JSON.stringify(proposals));
  }, [proposals]);

  // Xử lý Duyệt hoặc Từ chối đề xuất tăng lương
  const handleDecision = (proposal: SalaryProposal, action: 'APPROVE' | 'REJECT') => {
    setSelectedProposal(proposal);
    setActiveAction(action);
    setDirectorNoteInput(
      action === 'APPROVE'
        ? 'Đồng ý phê duyệt mức lương mới theo đề xuất của Quản lý chi nhánh.'
        : 'Cần tiếp tục theo dõi thêm 1 tháng về tỷ lệ hao hụt trước khi nâng bậc.'
    );
  };

  const handleConfirmDecision = async () => {
    if (!selectedProposal || !activeAction) return;

    const newStatus = activeAction === 'APPROVE' ? 'DA_DUYET' : 'TU_CHOI';
    const nowStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    setProposals((prev) =>
      prev.map((p) =>
        p.id === selectedProposal.id
          ? {
              ...p,
              status: newStatus,
              directorNote: directorNoteInput.trim(),
              decidedAt: nowStr,
            }
          : p
      )
    );

    // Cập nhật cả Dexie nếu có bảng
    try {
      if (db.salaryIncreaseProposals) {
        await db.salaryIncreaseProposals.update(selectedProposal.id, {
          status: newStatus,
          directorNote: directorNoteInput.trim(),
          decidedAt: nowStr,
        });
      }
    } catch (e) {
      // Ignored
    }

    if (activeAction === 'APPROVE') {
      showSuccess(`Đã phê duyệt tăng lương cho ${selectedProposal.fullName} (${selectedProposal.proposedSalary.toLocaleString('vi-VN')} đ)!`);
    } else {
      showSuccess(`Đã từ chối / yêu cầu xem xét lại đề xuất của ${selectedProposal.fullName}`);
    }

    setSelectedProposal(null);
    setActiveAction(null);
  };

  const filteredProposals = proposals.filter((p) => {
    if (filterProposalStatus === 'ALL') return true;
    return p.status === filterProposalStatus;
  });

  const pendingCount = proposals.filter((p) => p.status === 'CHO_DUYET').length;

  return (
    <div className="space-y-4 xl:space-y-3 xl:h-[calc(100vh-80px)] xl:overflow-hidden flex flex-col animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & 4 KPI CHIẾN LƯỢC BENTO TOP (TOP 22-25% KHUNG NHÌN)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 space-y-2.5">
        {/* Sleek Cockpit Banner Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-3 sm:p-4 text-white shadow-xl border border-indigo-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-amber-400 shrink-0">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Bảng Chỉ Huy Tổng Giám Đốc (Executive Cockpit 16:9)
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
                  Live Sheets T11
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                Bức tranh tài chính & thất thoát 18 ngày đối soát: Thái Nguyên (TN) vs Quế Võ (QV)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 hidden lg:inline flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> 01/11 - 18/11/2026
            </span>
            <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3 py-1 rounded-xl font-bold">
              Biên Lợi Nhuận Gộp Chuỗi: <strong>32.8%</strong>
            </span>
          </div>
        </div>

        {/* 4 Thẻ KPI Chiến Lược */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* KPI 1: Doanh Thu */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">Tổng Doanh Thu Chuỗi</div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">1.225.000.000 đ</div>
              <div className="text-[10px] text-slate-500 mt-0.5">TN: <strong className="text-amber-600">685tr (55.9%)</strong> • QV: <strong className="text-indigo-600">540tr (44.1%)</strong></div>
            </div>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 2: % Cost Thực Phẩm */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">% Cost Thực Phẩm TB</div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">46.8% <span className="text-xs font-normal text-slate-400">/ DT</span></div>
              <div className="text-[10px] text-slate-500 mt-0.5">TN: <strong className="text-amber-700">47.9% 🟡</strong> • QV: <strong className="text-emerald-700">45.4% 🟢</strong></div>
            </div>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <Scale className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 3: Quỹ Lương */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">Quỹ Lương Toàn Chuỗi</div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">250.000.000 đ</div>
              <div className="text-[10px] text-slate-500 mt-0.5">20.4% Doanh thu • <strong className="text-blue-700">49 Nhân sự</strong></div>
            </div>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 4: Thất Thoát */}
          <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-200/90 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-rose-800 uppercase">Thất Thoát Cảnh Báo Nóng</div>
              <div className="text-lg sm:text-xl font-black text-rose-700 mt-0.5">33.830.000 đ</div>
              <div className="text-[10px] text-rose-600 mt-0.5">🚨 4 món vượt kg • 3 NCC vi phạm</div>
            </div>
            <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. BENTO GRID 16:9 MAIN BODY (HÀNG GIỮA 45% & HÀNG DƯỚI 30%)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-3 min-h-0 xl:overflow-hidden">
        {/* ════════════════════════════════════════════════════════════
            HÀNG GIỮA (MID 45%): LÃI / LỖ 2 CN (8 CỘT) + THẤT THOÁT NÓNG (4 CỘT)
        ════════════════════════════════════════════════════════════ */}
        <div className="xl:flex-[54] grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
          {/* BENTO 1: SO SÁNH LÃI / LỖ 2 CHI NHÁNH (8/12 CỘT) */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-3 min-h-0">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    So Sánh Hiệu Quả Lãi / Lỗ 2 Chi Nhánh
                  </h3>
                  <p className="text-[11px] text-slate-500">Doanh thu vs Cost thực phẩm vs Lương (Thái Nguyên vs Quế Võ)</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                ✓ Cả 2 CN Đều Có Lãi
              </span>
            </div>

            {/* Cards so sánh 2 Chi nhánh */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">
              {/* Chi nhánh 1: Thái Nguyên */}
              <div className="rounded-xl p-3 bg-gradient-to-br from-amber-50/70 to-slate-50 border border-amber-200/80 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Cơ sở 1 • 29 NV
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">1.529,5 khách</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">Sen Việt Thái Nguyên</h4>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Doanh thu:</span>
                    <span className="font-extrabold text-slate-900">685.000.000 đ</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> CP Thực phẩm:
                    </span>
                    <span className="font-bold text-rose-600">328.000.000 đ (47.9%)</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Quỹ lương (29 NV):
                    </span>
                    <span className="font-bold text-blue-700">148.000.000 đ (21.6%)</span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-amber-200/60 text-slate-900 font-extrabold">
                    <span>Lợi nhuận gộp:</span>
                    <span className="text-emerald-700 font-black">209.000.000 đ (30.5%)</span>
                  </div>
                </div>

                <div className="p-1.5 rounded-lg bg-amber-100/60 text-[10px] text-amber-900 font-medium leading-snug">
                  💡 <strong>Nhận xét:</strong> Doanh thu cao nhất nhưng cost thực phẩm cao (47.9%), cần siết hụt cua thịt.
                </div>
              </div>

              {/* Chi nhánh 2: Quế Võ */}
              <div className="rounded-xl p-3 bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-200/80 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Cơ sở 2 • 20 NV
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">1.244,5 khách</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">Sen Việt Quế Võ</h4>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Doanh thu:</span>
                    <span className="font-extrabold text-slate-900">540.000.000 đ</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> CP Thực phẩm:
                    </span>
                    <span className="font-bold text-emerald-700">245.000.000 đ (45.4%)</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Quỹ lương (20 NV):
                    </span>
                    <span className="font-bold text-blue-700">102.000.000 đ (18.9%)</span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-indigo-200/60 text-slate-900 font-extrabold">
                    <span>Lợi nhuận gộp:</span>
                    <span className="text-emerald-700 font-black">193.000.000 đ (35.7%)</span>
                  </div>
                </div>

                <div className="p-1.5 rounded-lg bg-indigo-100/60 text-[10px] text-indigo-900 font-medium leading-snug">
                  ⭐ <strong>Hiệu quả:</strong> Kiểm soát cost tốt (45.4%), tỷ suất lợi nhuận gộp 35.7% vượt trội.
                </div>
              </div>
            </div>

            {/* Visual Breakdown Bar Comparison */}
            <div className="space-y-1 pt-1 flex-shrink-0">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Cơ cấu Doanh Thu Chuỗi:</span>
                <span>Thái Nguyên (55.9%) • Quế Võ (44.1%)</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: '55.9%' }} title="Thái Nguyên: 55.9%" />
                <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: '44.1%' }} title="Quế Võ: 44.1%" />
              </div>
            </div>
          </div>

          {/* BENTO 2: CẢNH BÁO THẤT THOÁT NÓNG (4/12 CỘT) */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-2.5 min-h-0 overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Cảnh Báo Thất Thoát Nóng
                  </h3>
                  <p className="text-[11px] text-slate-500">Mặt hàng vượt kg/khách cao nhất T11</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold shrink-0">
                🚨 4 Món Báo Đỏ
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1 min-h-0">
              {/* Món 1: Cua Thịt TN */}
              <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-slate-900 truncate">Cua Thịt Cà Mau (TN)</span>
                    <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-bold">+21.4%</span>
                  </div>
                  <div className="text-[10px] text-slate-600">Định mức: 0.280 ➔ Thực tế: <strong className="text-rose-700">0.340 kg/k</strong></div>
                  <div className="text-[10px] text-slate-500">Hụt: <strong>45.2 kg</strong> (~18.5 tr)</div>
                </div>
                <span className="text-xs font-black text-rose-700 bg-white px-2 py-0.5 rounded-lg border border-rose-200 shrink-0">
                  -18.5 tr
                </span>
              </div>

              {/* Món 2: Ghẹ Nghệ An */}
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-slate-900 truncate">Ghẹ Sống Nghệ An (TN)</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-600 text-white text-[9px] font-bold">+22.7%</span>
                  </div>
                  <div className="text-[10px] text-slate-600">Định mức: 0.220 ➔ Thực tế: <strong className="text-amber-800">0.270 kg/k</strong></div>
                  <div className="text-[10px] text-slate-500">Hụt: <strong>38.0 kg</strong> (~13.3 tr)</div>
                </div>
                <span className="text-xs font-black text-amber-800 bg-white px-2 py-0.5 rounded-lg border border-amber-200 shrink-0">
                  -13.3 tr
                </span>
              </div>

              {/* Món 3: Ba Chỉ Bò Mỹ */}
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 truncate">Ba Chỉ Bò Mỹ Nướng</div>
                  <div className="text-[10px] text-slate-500">Hụt 22.8 kg so với định mức buffet</div>
                </div>
                <span className="text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                  -4.56 tr
                </span>
              </div>

              {/* Món 4: Cá Hồi Phi Lê */}
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 truncate">Cá Hồi Phi Lê Nauy</div>
                  <div className="text-[10px] text-slate-500">Hụt 15.2 kg so với định mức buffet</div>
                </div>
                <span className="text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                  -5.32 tr
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            HÀNG DƯỚI (BOTTOM 30%): BẢNG ĐEN NCC (6 CỘT) + DUYỆT TĂNG LƯƠNG (6 CỘT)
        ════════════════════════════════════════════════════════════ */}
        <div className="xl:flex-[46] grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
          {/* BENTO 3: BẢNG ĐEN NCC GIAO THIẾU & CUA CHẾT (6 CỘT) */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-2.5 min-h-0 overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Bảng Đen NCC Giao Thiếu & Cua Chết
                  </h3>
                  <p className="text-[11px] text-slate-500">Top 3 NCC phạt nặng nhất theo đối soát thực tế T11</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                Đối Soát T11
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1 min-h-0">
              {/* NCC 1: Liên Cua Cà Mau */}
              <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center">1</span>
                    <h5 className="font-extrabold text-xs text-slate-900">Liên Cua Cà Mau (TNLIEUCUA)</h5>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black">Hao hụt 10.9%</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                  <div className="p-1 rounded-lg bg-white border border-rose-100">
                    <span className="text-[9px] text-slate-400 block">Tổng giao</span>
                    <span className="font-bold text-slate-800">520.0 kg</span>
                  </div>
                  <div className="p-1 rounded-lg bg-white border border-rose-100">
                    <span className="text-[9px] text-rose-500 block">Chết/hỏng</span>
                    <span className="font-black text-rose-600">42 kg (8.1%)</span>
                  </div>
                  <div className="p-1 rounded-lg bg-white border border-rose-100">
                    <span className="text-[9px] text-rose-500 block">Cân thiếu</span>
                    <span className="font-black text-rose-600">14.5 kg (2.8%)</span>
                  </div>
                </div>
                <div className="text-[10px] text-rose-700 flex items-center justify-between font-medium">
                  <span>Thiệt hại: <strong>23.165.000 đ</strong></span>
                  <span className="bg-rose-100 px-1.5 py-0.5 rounded text-rose-800 font-bold">Yêu cầu trừ công nợ</span>
                </div>
              </div>

              {/* NCC 2: Cô Phượng Ghẹ Nghệ An */}
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center">2</span>
                    <h5 className="font-extrabold text-xs text-slate-900">Cô Phượng Ghẹ Nghệ An (TNPHUONGGHE)</h5>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[10px] font-black">Hao hụt 8.5%</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                  <div className="p-1 rounded-lg bg-white border border-amber-100">
                    <span className="text-[9px] text-slate-400 block">Tổng giao</span>
                    <span className="font-bold text-slate-800">480.0 kg</span>
                  </div>
                  <div className="p-1 rounded-lg bg-white border border-amber-100">
                    <span className="text-[9px] text-amber-600 block">Óp/chết</span>
                    <span className="font-black text-amber-700">31 kg (6.5%)</span>
                  </div>
                  <div className="p-1 rounded-lg bg-white border border-amber-100">
                    <span className="text-[9px] text-amber-600 block">Cân thiếu</span>
                    <span className="font-black text-amber-700">9.8 kg (2.0%)</span>
                  </div>
                </div>
                <div className="text-[10px] text-amber-900 flex items-center justify-between font-medium">
                  <span>Thiệt hại: <strong>14.280.000 đ</strong></span>
                  <span className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-bold">Bù ký đơn tiếp</span>
                </div>
              </div>

              {/* NCC 3: Dũng Cẩm Phả */}
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">3. Dũng Cẩm Phả (Hàu, Bề bề)</span>
                  <div className="text-[10px] text-slate-500">Giao 350kg • Cân thiếu 12.2kg (3.5%) • Hỏng 8kg</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px]">
                  5.8% Hụt
                </span>
              </div>
            </div>
          </div>

          {/* BENTO 4: DUYỆT TĂNG LƯƠNG CHUỖI (6 CỘT) */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-2.5 min-h-0 overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Duyệt Tăng Lương Chuỗi
                  </h3>
                  <p className="text-[11px] text-slate-500">Đề xuất tăng bậc lương theo điểm thi nghề & KPI</p>
                </div>
              </div>

              {/* Filter buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  onClick={() => setFilterProposalStatus('ALL')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    filterProposalStatus === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Tất cả ({proposals.length})
                </button>
                <button
                  onClick={() => setFilterProposalStatus('CHO_DUYET')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    filterProposalStatus === 'CHO_DUYET'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-amber-700'
                  }`}
                >
                  Chờ duyệt ({pendingCount})
                </button>
              </div>
            </div>

            {/* Proposals List */}
            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 min-h-0">
              {filteredProposals.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Không có đề xuất tăng lương nào theo bộ lọc này.
                </div>
              ) : (
                filteredProposals.map((item) => {
                  const diff = item.proposedSalary - item.currentSalary;
                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border transition-all ${
                        item.status === 'CHO_DUYET'
                          ? 'bg-amber-50/40 border-amber-200'
                          : item.status === 'DA_DUYET'
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-rose-50/30 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="font-extrabold text-xs text-slate-900">
                              {item.fullName}
                            </h5>
                            <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-semibold">
                              {item.branchName.includes('Thái Nguyên') ? 'CN TN' : 'CN QV'}
                            </span>
                            <span className="px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 text-[9px] font-bold">
                              Thi: {item.examScore}/100
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{item.position}</p>
                        </div>

                        {/* Status Badge */}
                        {item.status === 'CHO_DUYET' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-extrabold shrink-0">
                            Chờ duyệt
                          </span>
                        )}
                        {item.status === 'DA_DUYET' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold shrink-0 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Đã duyệt
                          </span>
                        )}
                        {item.status === 'TU_CHOI' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[9px] font-extrabold shrink-0 flex items-center gap-0.5">
                            <X className="w-2.5 h-2.5" /> Đã từ chối
                          </span>
                        )}
                      </div>

                      {/* Salary Jump */}
                      <div className="flex items-center justify-between text-xs bg-white p-1.5 rounded-lg border border-slate-100 mt-1.5">
                        <span className="text-slate-600 text-[11px]">
                          {item.currentSalary.toLocaleString('vi-VN')} đ
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-emerald-700 font-extrabold text-[11px]">
                          {item.proposedSalary.toLocaleString('vi-VN')} đ{' '}
                          <span className="text-[9px] text-emerald-600 font-bold">
                            (+{diff.toLocaleString('vi-VN')})
                          </span>
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-600 mt-1 italic">
                        &quot;{item.reason}&quot;
                      </p>

                      {/* Giám đốc note if decided */}
                      {item.directorNote && (
                        <div className="mt-1.5 p-1.5 rounded-lg bg-white/80 border border-slate-200 text-[10px] text-slate-700">
                          <span className="font-bold text-slate-900">Ý kiến Giám đốc:</span> {item.directorNote}
                        </div>
                      )}

                      {/* Action buttons if CHO_DUYET */}
                      {item.status === 'CHO_DUYET' && (
                        <div className="flex items-center gap-2 pt-2 mt-1 border-t border-amber-200/60">
                          <button
                            onClick={() => handleDecision(item, 'APPROVE')}
                            className="flex-1 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Phê Duyệt
                          </button>
                          <button
                            onClick={() => handleDecision(item, 'REJECT')}
                            className="py-1 px-2.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                          >
                            <X className="w-3 h-3" /> Từ Chối
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MODAL CONFIRMATION DIALOG (PHÊ DUYỆT / TỪ CHỐI TĂNG LƯƠNG)
      ───────────────────────────────────────────────────────────── */}
      {selectedProposal && activeAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {activeAction === 'APPROVE' ? (
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                    <XCircle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {activeAction === 'APPROVE' ? 'Xác Nhận Duyệt Tăng Lương' : 'Từ Chối / Hoãn Tăng Lương'}
                  </h4>
                  <p className="text-xs text-slate-500">{selectedProposal.fullName} - {selectedProposal.branchName}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedProposal(null);
                  setActiveAction(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Mức lương hiện tại:</span>
                <span className="font-bold text-slate-800">{selectedProposal.currentSalary.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mức lương sau điều chỉnh:</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {selectedProposal.proposedSalary.toLocaleString('vi-VN')} đ (+{(selectedProposal.proposedSalary - selectedProposal.currentSalary).toLocaleString('vi-VN')} đ)
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Điểm thi tay nghề:</span>
                <span className="font-bold text-indigo-700">{selectedProposal.examScore} / 100 điểm</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                Chỉ đạo / Lý do của Giám Đốc:
              </label>
              <textarea
                rows={3}
                value={directorNoteInput}
                onChange={(e) => setDirectorNoteInput(e.target.value)}
                placeholder="Nhập ghi chú chỉ đạo hoặc lý do duyệt/từ chối..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedProposal(null);
                  setActiveAction(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Đóng
              </button>
              <button
                onClick={handleConfirmDecision}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all ${
                  activeAction === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {activeAction === 'APPROVE' ? 'Xác Nhận Phê Duyệt' : 'Xác Nhận Từ Chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ExecutiveCockpit;
