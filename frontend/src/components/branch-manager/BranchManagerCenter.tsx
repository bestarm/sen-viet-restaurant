import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { db, Batch } from '../../db/schema';
import {
  Briefcase,
  Users,
  Clock,
  MapPin,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Award,
  DollarSign,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Unlock,
  Check,
  X,
  Building2,
  FileText,
  UserX,
  Compass,
  MessageSquare,
  LogOut,
  LogIn,
  Camera,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Flame,
  Scale,
  Boxes,
  ArrowRight,
} from 'lucide-react';

export interface BranchManagerCenterProps {
  onNavigateToWarehouse?: () => void;
}

export interface ShiftAttendance {
  id: number;
  userId: number;
  fullName: string;
  position: string;
  shiftName: string;
  checkInTime: string;
  checkInDistanceMeters: number;
  isValidLocation: boolean;
  lateMinutes: number;
  status: 'DANG_LAM' | 'VI_PHAM_KHOANG_CACH' | 'DA_VE';
}

export interface BreakOutLog {
  id: string;
  employeeName: string;
  employeePosition: string;
  reasonType: 'WC' | 'VIEC_RIENG' | 'TIEP_KHACH' | 'MUA_DO';
  reasonDetail: string;
  outTime: string; // HH:mm
  inTime?: string; // HH:mm
  durationMinutes: number;
  timesInShift: number;
  isOverTime: boolean; // > 15 phút
  isOverFrequency: boolean; // > 3 lần/ca
  status: 'DANG_RA_NGOAI' | 'DA_QUAY_LAI';
}

export interface ViolationPenalty {
  id: string;
  employeeName: string;
  employeePosition: string;
  violationType: string;
  fineAmount: number;
  note: string;
  createdByName: string;
  createdAt: string;
  isDeductedFromSalary: boolean;
}

export interface SkillExamRecord {
  id: string;
  employeeName: string;
  position: string;
  subject: string;
  cutScore: number; // Kỹ thuật dao (tối đa 40)
  hygieneScore: number; // Vệ sinh thớt (tối đa 30)
  speedScore: number; // Tốc độ (tối đa 30)
  totalScore: number;
  isPassed: boolean;
  canRetake: boolean;
  evaluatedAt: string;
  evaluatorName: string;
  note?: string;
}

export type ManagerBatchItem = Batch;

const INITIAL_ATTENDANCES: ShiftAttendance[] = [
  {
    id: 1,
    userId: 1,
    fullName: 'Nguyễn Văn Bếp',
    position: 'Bếp viên chính (Khu Hải Sản)',
    shiftName: 'Ca Sáng (08:00 - 16:30)',
    checkInTime: '07:55',
    checkInDistanceMeters: 8,
    isValidLocation: true,
    lateMinutes: 0,
    status: 'DANG_LAM',
  },
  {
    id: 2,
    userId: 2,
    fullName: 'Trần Thị Bếp Trưởng',
    position: 'Bếp trưởng chi nhánh',
    shiftName: 'Ca Sáng (08:00 - 16:30)',
    checkInTime: '07:50',
    checkInDistanceMeters: 12,
    isValidLocation: true,
    lateMinutes: 0,
    status: 'DANG_LAM',
  },
  {
    id: 3,
    userId: 7,
    fullName: 'Hoàng Mai Phục Vụ',
    position: 'Nhân viên Phục Vụ Bàn',
    shiftName: 'Ca Sáng (08:00 - 16:30)',
    checkInTime: '08:25',
    checkInDistanceMeters: 15,
    isValidLocation: true,
    lateMinutes: 25,
    status: 'DANG_LAM',
  },
  {
    id: 4,
    userId: 9,
    fullName: 'Bùi Lan Tạp Vụ',
    position: 'Nhân viên Tạp Vụ',
    shiftName: 'Ca Sáng (08:00 - 16:30)',
    checkInTime: '08:12',
    checkInDistanceMeters: 125,
    isValidLocation: false,
    lateMinutes: 12,
    status: 'VI_PHAM_KHOANG_CACH',
  },
  {
    id: 5,
    userId: 11,
    fullName: 'Đỗ Văn Kho',
    position: 'Thủ kho cơ sở',
    shiftName: 'Ca Sáng (08:00 - 16:30)',
    checkInTime: '07:45',
    checkInDistanceMeters: 6,
    isValidLocation: true,
    lateMinutes: 0,
    status: 'DANG_LAM',
  },
  {
    id: 6,
    userId: 12,
    fullName: 'Phạm Minh Thu Ngân',
    position: 'Nhân viên Thu Ngân',
    shiftName: 'Ca Sáng (08:00 - 16:30)',
    checkInTime: '07:58',
    checkInDistanceMeters: 18,
    isValidLocation: true,
    lateMinutes: 0,
    status: 'DANG_LAM',
  },
];

const INITIAL_BREAK_LOGS: BreakOutLog[] = [
  {
    id: 'RN-001',
    employeeName: 'Bùi Lan Tạp Vụ',
    employeePosition: 'Tạp vụ',
    reasonType: 'VIEC_RIENG',
    reasonDetail: 'Ra ngoài nhận thuốc gửi từ quê',
    outTime: '09:10',
    inTime: '09:32',
    durationMinutes: 22,
    timesInShift: 1,
    isOverTime: true, // 22 phút > 15 phút
    isOverFrequency: false,
    status: 'DA_QUAY_LAI',
  },
  {
    id: 'RN-002',
    employeeName: 'Hoàng Mai Phục Vụ',
    employeePosition: 'Phục vụ bàn',
    reasonType: 'WC',
    reasonDetail: 'Đi vệ sinh cá nhân',
    outTime: '10:05',
    inTime: '10:14',
    durationMinutes: 9,
    timesInShift: 4,
    isOverTime: false,
    isOverFrequency: true, // Lần thứ 4 trong ca > 3 lần
    status: 'DA_QUAY_LAI',
  },
  {
    id: 'RN-003',
    employeeName: 'Nguyễn Văn Bếp',
    employeePosition: 'Bếp viên chính',
    reasonType: 'MUA_DO',
    reasonDetail: 'Chạy ra chợ mua gấp ớt chuông bổ sung',
    outTime: '11:15',
    inTime: undefined,
    durationMinutes: 10,
    timesInShift: 1,
    isOverTime: false,
    isOverFrequency: false,
    status: 'DANG_RA_NGOAI',
  },
];

const INITIAL_PENALTIES: ViolationPenalty[] = [
  {
    id: 'PHAT-202611-001',
    employeeName: 'Hoàng Mai Phục Vụ',
    employeePosition: 'Phục vụ bàn',
    violationType: 'Đi muộn không báo trước (> 20 phút)',
    fineAmount: 100000,
    note: 'Đi muộn 25 phút trong ca sáng ngày 18/11 không có lý do chính đáng',
    createdByName: 'Lê Hoàng Quản Lý',
    createdAt: '18/11/2026 08:35',
    isDeductedFromSalary: true,
  },
  {
    id: 'PHAT-202611-002',
    employeeName: 'Bùi Lan Tạp Vụ',
    employeePosition: 'Tạp vụ',
    violationType: 'Gian lận chấm công GPS ngoài chi nhánh (> 50m)',
    fineAmount: 200000,
    note: 'Check-in cách nhà hàng 125m khi chưa có mặt tại điểm làm việc',
    createdByName: 'Lê Hoàng Quản Lý',
    createdAt: '18/11/2026 08:20',
    isDeductedFromSalary: true,
  },
];

const INITIAL_EXAMS: SkillExamRecord[] = [
  {
    id: 'EX-001',
    employeeName: 'Nguyễn Văn Bếp',
    position: 'Bếp viên chính',
    subject: 'Dao thớt & Sơ chế Cá hồi Nauy',
    cutScore: 39,
    hygieneScore: 29,
    speedScore: 28,
    totalScore: 96,
    isPassed: true,
    canRetake: false,
    evaluatedAt: '17/11/2026',
    evaluatorName: 'Trần Thị Bếp Trưởng & Lê Hoàng Quản Lý',
    note: 'Tay nghề xuất sắc, thớ cá hồi phẳng đẹp, hao hụt lóc xương chỉ 3.8%',
  },
  {
    id: 'EX-002',
    employeeName: 'Hoàng Mai Phục Vụ',
    position: 'Phục vụ bàn',
    subject: 'Nghiệp vụ Order & Bày line Buffet',
    cutScore: 25,
    hygieneScore: 20,
    speedScore: 18,
    totalScore: 63,
    isPassed: false,
    canRetake: true,
    evaluatedAt: '17/11/2026',
    evaluatorName: 'Lê Hoàng Quản Lý',
    note: 'Chưa nhớ hết vị trí món quầy nóng và món khai vị, thao tác chậm',
  },
];

export const BranchManagerCenter: React.FC<BranchManagerCenterProps> = ({ onNavigateToWarehouse }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'GPS_SHIFT' | 'BREAK_LOG' | 'PENALTY' | 'SKILL_EXAM' | 'BATCH_AUDIT'>('GPS_SHIFT');

  // --- TAB 5: ĐỐI SOÁT MẺ NẤU & CHỐNG GIAN LẬN CÂN BÀN (TASK-WH-05) ---
  const [batches, setBatches] = useState<ManagerBatchItem[]>([]);
  const [selectedScalePhoto, setSelectedScalePhoto] = useState<{ photoUrl: string; batch: ManagerBatchItem } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [explanationBatch, setExplanationBatch] = useState<ManagerBatchItem | null>(null);
  const [explanationNote, setExplanationNote] = useState<string>('');
  const [alsoRecordPenalty, setAlsoRecordPenalty] = useState<boolean>(true);
  const [batchPenaltyAmount, setBatchPenaltyAmount] = useState<number>(100000);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState<boolean>(false);

  // --- TAB 1: QUÂN SỐ & GPS ---
  const [attendances, setAttendances] = useState<ShiftAttendance[]>(INITIAL_ATTENDANCES);

  // --- TAB 2: ĐĂNG KÝ RA NGOÀI (Sheet ĐĂNG KÝ RA NGOÀI) ---
  const [breakLogs, setBreakLogs] = useState<BreakOutLog[]>(() => {
    const saved = localStorage.getItem('senviet_break_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_BREAK_LOGS;
      }
    }
    return INITIAL_BREAK_LOGS;
  });

  const [newBreakEmployee, setNewBreakEmployee] = useState<string>('Hoàng Mai Phục Vụ');
  const [newBreakReason, setNewBreakReason] = useState<'WC' | 'VIEC_RIENG' | 'TIEP_KHACH' | 'MUA_DO'>('WC');
  const [newBreakDetail, setNewBreakDetail] = useState<string>('');

  // --- TAB 3: GHI PHẠT VI PHẠM (Sheet PHAT) ---
  const [penalties, setPenalties] = useState<ViolationPenalty[]>(() => {
    const saved = localStorage.getItem('senviet_penalties');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_PENALTIES;
      }
    }
    return INITIAL_PENALTIES;
  });

  const [penaltyEmployee, setPenaltyEmployee] = useState<string>('Bùi Lan Tạp Vụ');
  const [penaltyType, setPenaltyType] = useState<string>('Đi muộn không báo trước (> 15 phút)');
  const [penaltyAmount, setPenaltyAmount] = useState<number>(100000);
  const [penaltyNote, setPenaltyNote] = useState<string>('');

  // --- TAB 4: CHẤM THI TAY NGHỀ ---
  const [exams, setExams] = useState<SkillExamRecord[]>(() => {
    const saved = localStorage.getItem('senviet_skill_exams');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_EXAMS;
      }
    }
    return INITIAL_EXAMS;
  });

  const [examEmployee, setExamEmployee] = useState<string>('Hoàng Mai Phục Vụ');
  const [examSubject, setExamSubject] = useState<string>('Dao thớt & Sơ chế Cá hồi Nauy');
  const [cutScoreInput, setCutScoreInput] = useState<number>(35);
  const [hygieneScoreInput, setHygieneScoreInput] = useState<number>(25);
  const [speedScoreInput, setSpeedScoreInput] = useState<number>(25);
  const [examNoteInput, setExamNoteInput] = useState<string>('');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('senviet_break_logs', JSON.stringify(breakLogs));
  }, [breakLogs]);

  useEffect(() => {
    localStorage.setItem('senviet_penalties', JSON.stringify(penalties));
  }, [penalties]);

  useEffect(() => {
    localStorage.setItem('senviet_skill_exams', JSON.stringify(exams));
  }, [exams]);

  const loadBatches = async () => {
    try {
      if (db.batches) {
        let list = await db.batches.toArray();
        if (user?.branchId) {
          list = list.filter((b) => !b.branchId || b.branchId === user.branchId);
        }
        setBatches(list.reverse());
      }
    } catch (e) {
      console.error('Error loading batches in BranchManagerCenter:', e);
    }
  };

  useEffect(() => {
    loadBatches();
  }, [user]);

  const overStandardBatchCount = batches.filter((b) => b.overStandard).length;

  // Quản lý xác nhận mẻ hợp lệ
  const handleApproveBatch = async (batch: ManagerBatchItem) => {
    try {
      setIsSubmittingApproval(true);
      const approverName = user?.fullName || 'Nguyễn Hoàng Nam (Quản Lý CN)';
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
      if (db.batches) {
        await db.batches.update(batch.id, {
          approvalStatus: 'HOP_LE',
          approvedBy: approverName,
          approvedAt: nowStr,
          approvalNote: 'Quản lý chi nhánh đã đối soát ảnh cân và xác nhận mẻ hợp lệ',
        });
      }
      showSuccess(`✅ Quản lý đã xác nhận mẻ [${batch.batchCode}] hợp lệ thành công!`);
      await loadBatches();
      if (selectedScalePhoto && selectedScalePhoto.batch.id === batch.id) {
        setSelectedScalePhoto(null);
      }
    } catch (err: any) {
      showError('Lỗi khi xác nhận mẻ: ' + (err.message || ''));
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Quản lý mở modal lập biên bản giải trình hao hụt
  const handleOpenExplanationModal = (batch: ManagerBatchItem) => {
    setExplanationBatch(batch);
    const diff =
      batch.lossRate !== undefined && batch.lossRate !== null
        ? (batch.lossRate - batch.standardLossRate).toFixed(1)
        : '0.0';
    setExplanationNote(
      batch.overStandard
        ? `Mẻ [${batch.itemName}] hao hụt ${batch.lossRate}%, vượt chuẩn ${batch.standardLossRate}% (+${diff}%). Quản lý yêu cầu đầu bếp ${batch.chefName || batch.startedBy || 'Nguyễn Văn Bếp'} giải trình!`
        : `Quản lý lập biên bản giải trình mẻ [${batch.batchCode}].`
    );
    setAlsoRecordPenalty(batch.overStandard || false);
    setBatchPenaltyAmount(100000);
  };

  // Quản lý lưu biên bản giải trình
  const handleSaveExplanation = async () => {
    if (!explanationBatch) return;
    if (!explanationNote.trim()) {
      showError('Vui lòng nhập nội dung biên bản giải trình hao hụt');
      return;
    }
    try {
      setIsSubmittingApproval(true);
      const approverName = user?.fullName || 'Nguyễn Hoàng Nam (Quản Lý CN)';
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
      if (db.batches) {
        await db.batches.update(explanationBatch.id, {
          approvalStatus: 'BIEN_BAN',
          approvedBy: approverName,
          approvedAt: nowStr,
          approvalNote: explanationNote.trim(),
        });
      }

      // Nếu tích chọn phạt vi phạm trừ lương
      if (alsoRecordPenalty) {
        const newPenalty: ViolationPenalty = {
          id: `FINE-${Date.now().toString().slice(-6)}`,
          employeeName: explanationBatch.chefName || explanationBatch.startedBy || 'Nguyễn Văn Bếp',
          employeePosition: 'Bếp viên chính (Khu Hải Sản)',
          violationType: `Làm hao hụt mẻ nấu [${explanationBatch.batchCode}] (${explanationBatch.lossRate}% vs chuẩn ${explanationBatch.standardLossRate}%)`,
          fineAmount: batchPenaltyAmount,
          note: explanationNote.trim(),
          createdByName: approverName,
          createdAt: nowStr,
          isDeductedFromSalary: true,
        };
        const updatedPenalties = [newPenalty, ...penalties];
        setPenalties(updatedPenalties);
        localStorage.setItem('senviet_penalties', JSON.stringify(updatedPenalties));
      }

      showSuccess(`⚠️ Đã lập biên bản giải trình cho mẻ [${explanationBatch.batchCode}]${alsoRecordPenalty ? ' và tạo biên bản phạt trừ lương!' : '!'}`);
      setExplanationBatch(null);
      setExplanationNote('');
      await loadBatches();
      if (selectedScalePhoto && selectedScalePhoto.batch.id === explanationBatch.id) {
        setSelectedScalePhoto(null);
      }
    } catch (err: any) {
      showError('Lỗi khi lập biên bản: ' + (err.message || ''));
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Tab 2: Thêm lượt ra ngoài mới
  const handleStartBreak = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    // Đếm số lần trong ca
    const currentTimes = breakLogs.filter((b) => b.employeeName === newBreakEmployee).length + 1;

    const newLog: BreakOutLog = {
      id: `RN-${Date.now().toString().slice(-4)}`,
      employeeName: newBreakEmployee,
      employeePosition: 'Nhân sự ca',
      reasonType: newBreakReason,
      reasonDetail: newBreakDetail.trim() || (newBreakReason === 'WC' ? 'Đi vệ sinh' : 'Việc riêng'),
      outTime: timeStr,
      durationMinutes: 0,
      timesInShift: currentTimes,
      isOverTime: false,
      isOverFrequency: currentTimes > 3,
      status: 'DANG_RA_NGOAI',
    };

    setBreakLogs((prev) => [newLog, ...prev]);
    showSuccess(`Đã ghi nhận [${newBreakEmployee}] ra ngoài lúc ${timeStr}!`);
    setNewBreakDetail('');
  };

  // Tab 2: Ghi nhận quay lại ca
  const handleEndBreak = (logId: string) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const inTimeStr = `${hh}:${mm}`;

    setBreakLogs((prev) =>
      prev.map((b) => {
        if (b.id !== logId) return b;

        // Tính khoảng cách phút
        const [outH, outM] = b.outTime.split(':').map(Number);
        const [inH, inM] = inTimeStr.split(':').map(Number);
        let diffMinutes = (inH * 60 + inM) - (outH * 60 + outM);
        if (diffMinutes < 0) diffMinutes += 24 * 60;
        if (diffMinutes === 0) diffMinutes = 5; // Tối thiểu 5p

        const isOverTime = diffMinutes > 15;

        return {
          ...b,
          inTime: inTimeStr,
          durationMinutes: diffMinutes,
          isOverTime,
          status: 'DA_QUAY_LAI',
        };
      })
    );

    showSuccess(`Đã ghi nhận nhân viên quay lại ca làm việc!`);
  };

  // Tab 3: Thêm biên bản phạt
  const handleCreatePenalty = () => {
    if (penaltyAmount <= 0) {
      showError('Số tiền phạt phải lớn hơn 0 đ');
      return;
    }

    const newPenalty: ViolationPenalty = {
      id: `PHAT-${Date.now().toString().slice(-6)}`,
      employeeName: penaltyEmployee,
      employeePosition: 'Nhân sự ca',
      violationType: penaltyType,
      fineAmount: penaltyAmount,
      note: penaltyNote.trim() || 'Lập biên bản vi phạm kỷ luật ca',
      createdByName: user?.fullName || 'Lê Hoàng Quản Lý',
      createdAt: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      isDeductedFromSalary: true,
    };

    setPenalties((prev) => [newPenalty, ...prev]);
    showSuccess(`Đã lập biên bản phạt ${penaltyAmount.toLocaleString('vi-VN')} đ đối với [${penaltyEmployee}]!`);
    setPenaltyNote('');
  };

  // Tab 4: Chấm thi tay nghề
  const handleScoreExam = () => {
    const total = cutScoreInput + hygieneScoreInput + speedScoreInput;
    const isPassed = total >= 75;

    const newRecord: SkillExamRecord = {
      id: `EX-${Date.now().toString().slice(-4)}`,
      employeeName: examEmployee,
      position: 'Nhân sự chi nhánh',
      subject: examSubject,
      cutScore: cutScoreInput,
      hygieneScore: hygieneScoreInput,
      speedScore: speedScoreInput,
      totalScore: total,
      isPassed,
      canRetake: !isPassed,
      evaluatedAt: new Date().toLocaleDateString('vi-VN'),
      evaluatorName: user?.fullName || 'Lê Hoàng Quản Lý',
      note: examNoteInput.trim() || (isPassed ? 'Kỹ năng đạt yêu cầu ca làm việc' : 'Cần rèn luyện thêm'),
    };

    setExams((prev) => [newRecord, ...prev]);
    showSuccess(`Đã lưu kết quả thi tay nghề: ${total}/100 điểm (${isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'})`);
    setExamNoteInput('');
  };

  // Tab 4: Mở quyền thi lại
  const handleAllowRetake = (examId: string) => {
    setExams((prev) =>
      prev.map((e) =>
        e.id === examId ? { ...e, canRetake: true } : e
      )
    );
    showSuccess(`Đã mở quyền thi lại cho nhân viên trên Cổng Cá Nhân!`);
  };

  // Quick stats
  const totalShiftCount = attendances.length;
  const lateCount = attendances.filter((a) => a.lateMinutes > 0).length;
  const gpsViolationCount = attendances.filter((a) => !a.isValidLocation).length;
  const breakingCount = breakLogs.filter((b) => b.status === 'DANG_RA_NGOAI').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER BANNER: QUẢN LÝ CHI NHÁNH
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-950/20 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
              <Briefcase className="h-4 w-4 text-blue-400" />
              <span>TRUNG TÂM ĐIỀU HÀNH QUẢN LÝ CHI NHÁNH • STORE MANAGER</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Kỷ Luật Ca, Chấm Công GPS & Thi Nghề
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
              Giám sát quân số ca trực, bắt vi phạm GPS ngoài chi nhánh, theo dõi thời gian ra ngoài theo sheet ĐĂNG KÝ RA NGOÀI, ghi nhận phạt trừ lương và chấm thi tay nghề dao thớt.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300">
              <span className="flex items-center gap-1 font-semibold text-white">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> Quản Lý: {user?.fullName || 'Lê Hoàng Quản Lý'} (Thái Nguyên)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Ca Sáng (08:00 - 16:30) • 18 Nhân Sự Trực
              </span>
            </div>

            {/* Quick Action: Chuyển nhanh đến phân hệ Kho cơ sở */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToWarehouse) onNavigateToWarehouse();
                  else window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'warehouse' }));
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
              >
                <Boxes className="w-4 h-4 text-indigo-200" />
                <span>Xem Kho Cơ Sở & Lô Hàng</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Counter Pills */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
              <div className="text-xl font-black text-white">{totalShiftCount}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Quân số ca</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
              <div className="text-xl font-black text-amber-400">{lateCount}</div>
              <div className="text-[10px] text-amber-300 font-semibold uppercase">Đi muộn</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
              <div className="text-xl font-black text-rose-400">{gpsViolationCount}</div>
              <div className="text-[10px] text-rose-300 font-semibold uppercase">Lệch GPS &gt;50m</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
              <div className="text-xl font-black text-blue-400">{breakingCount}</div>
              <div className="text-[10px] text-blue-300 font-semibold uppercase">Đang ra ngoài</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. NAV TABS CHỈ HUY (4 TAB)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('GPS_SHIFT')}
          className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'GPS_SHIFT'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>1. Quân Số & GPS</span>
          {gpsViolationCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[11px] font-black">
              {gpsViolationCount} vi phạm
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('BREAK_LOG')}
          className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'BREAK_LOG'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LogOut className="w-4 h-4" />
          <span>2. Đăng Ký Ra Ngoài</span>
          {breakLogs.some((b) => b.isOverTime || b.isOverFrequency) && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[11px] font-black">
              Cảnh báo
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('PENALTY')}
          className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'PENALTY'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>3. Ghi Phạt Vi Phạm</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 text-[11px] font-black">
            {penalties.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('SKILL_EXAM')}
          className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'SKILL_EXAM'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>4. Chấm Thi Tay Nghề</span>
        </button>

        <button
          onClick={() => setActiveTab('BATCH_AUDIT')}
          className={`flex-1 min-w-[190px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'BATCH_AUDIT'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>5. Soi Mẻ & Cân Điện Tử</span>
          {overStandardBatchCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[11px] font-black animate-pulse">
              {overStandardBatchCount} vượt chuẩn
            </span>
          )}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. TAB 1: QUÂN SỐ CA & CẢNH BÁO GPS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'GPS_SHIFT' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" />
                Danh Sách Quân Số & Giám Sát GPS Ca Làm Việc
              </h3>
              <p className="text-xs text-slate-500">
                Phát hiện ngay nhân viên đi muộn hoặc gian lận check-in ngoài ranh giới nhà hàng (&gt;50m)
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 shrink-0">
              Ranh giới GPS cho phép: &le; 50 mét
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                  <th className="pb-2">Nhân Viên</th>
                  <th className="pb-2">Vị Trí / Bộ Phận</th>
                  <th className="pb-2">Ca Làm Việc</th>
                  <th className="pb-2">Giờ Vào Ca</th>
                  <th className="pb-2 text-right">Khoảng Cách GPS</th>
                  <th className="pb-2 text-center">Trạng Thái GPS</th>
                  <th className="pb-2 text-right">Tác Vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendances.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-bold text-slate-900">
                      {item.fullName}
                      {item.lateMinutes > 0 && (
                        <span className="text-[10px] text-amber-600 block font-normal">
                          Muộn {item.lateMinutes} phút
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-600">{item.position}</td>
                    <td className="py-3 text-slate-600">{item.shiftName}</td>
                    <td className="py-3 font-mono font-bold text-slate-800">{item.checkInTime}</td>
                    <td className="py-3 text-right">
                      <span
                        className={`font-black ${
                          !item.isValidLocation ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {item.checkInDistanceMeters}m
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      {!item.isValidLocation ? (
                        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Vi phạm GPS (&gt;50m)
                        </span>
                      ) : item.lateMinutes > 0 ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Đi muộn
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Hợp lệ
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {!item.isValidLocation ? (
                        <button
                          onClick={() => {
                            setPenaltyEmployee(item.fullName);
                            setPenaltyType('Gian lận chấm công GPS ngoài chi nhánh (> 50m)');
                            setPenaltyAmount(200000);
                            setPenaltyNote(`Tọa độ check-in cách chi nhánh ${item.checkInDistanceMeters}m lúc ${item.checkInTime}`);
                            setActiveTab('PENALTY');
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] shadow-xs"
                        >
                          Lập Biên Bản Phạt
                        </button>
                      ) : item.lateMinutes > 15 ? (
                        <button
                          onClick={() => {
                            setPenaltyEmployee(item.fullName);
                            setPenaltyType('Đi muộn không báo trước (> 15 phút)');
                            setPenaltyAmount(100000);
                            setPenaltyNote(`Đi muộn ${item.lateMinutes} phút ca sáng`);
                            setActiveTab('PENALTY');
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] shadow-xs"
                        >
                          Phạt Đi Muộn
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Chuẩn kỷ luật</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. TAB 2: ĐĂNG KÝ RA NGOÀI (SHEET ĐĂNG KÝ RA NGOÀI)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'BREAK_LOG' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Ghi Nhận Ra Ngoài - 5 cột */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Ghi Nhận Ra Ngoài Ca
                  </h3>
                  <p className="text-xs text-slate-500">Theo dõi sheet ĐĂNG KÝ RA NGOÀI</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                Quy định &le; 15p
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn Nhân Viên:</label>
                <select
                  value={newBreakEmployee}
                  onChange={(e) => setNewBreakEmployee(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {attendances.map((a) => (
                    <option key={a.id} value={a.fullName}>
                      {a.fullName} - {a.position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lý Do Ra Ngoài:</label>
                <select
                  value={newBreakReason}
                  onChange={(e: any) => setNewBreakReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="WC">Đi vệ sinh cá nhân (WC)</option>
                  <option value="VIEC_RIENG">Việc riêng khẩn cấp cá nhân</option>
                  <option value="TIEP_KHACH">Gặp người nhà / Tiếp khách</option>
                  <option value="MUA_DO">Đi mua đồ / vật tư bổ sung gấp cho quán</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Chi Tiết / Giải Trình:</label>
                <textarea
                  rows={2}
                  value={newBreakDetail}
                  onChange={(e) => setNewBreakDetail(e.target.value)}
                  placeholder="Ghi chú chi tiết nếu cần..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">Nội quy ca Sen Việt Buffet:</span>
                <div>• Mỗi lần ra ngoài tối đa <strong>15 phút</strong>.</div>
                <div>• Một ca làm việc không được ra ngoài quá <strong>3 lần</strong>.</div>
                <div>• Vi phạm sẽ bị cảnh báo đỏ và lập biên bản phạt trừ lương.</div>
              </div>

              <button
                onClick={handleStartBreak}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Bắt Đầu Ghi Nhận Ra Ngoài
              </button>
            </div>
          </div>

          {/* Danh Sách Nhật Ký Ra Ngoài Trong Ca - 7 cột */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Nhật Ký Ra Ngoài Hôm Nay
              </h3>
              <span className="text-xs text-slate-500 font-semibold">{breakLogs.length} lượt</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {breakLogs.map((log) => {
                const isOverTime = log.isOverTime;
                const isOverFreq = log.isOverFrequency;
                const hasViolation = isOverTime || isOverFreq;

                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-2xl border transition-all space-y-2 ${
                      hasViolation
                        ? 'bg-rose-50/50 border-rose-200 ring-2 ring-rose-500/10'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-sm text-slate-900">{log.employeeName}</h5>
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold text-[10px]">
                            Lần thứ {log.timesInShift}/ca
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 mt-0.5 block">
                          Lý do: <strong>{log.reasonDetail}</strong>
                        </span>
                      </div>

                      {log.status === 'DANG_RA_NGOAI' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold animate-pulse">
                          Đang ra ngoài
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                          Đã quay lại
                        </span>
                      )}
                    </div>

                    {/* Time Details */}
                    <div className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-slate-200/60">
                      <div>
                        Ra: <strong className="text-slate-800 font-mono">{log.outTime}</strong>
                      </div>
                      <div>
                        Vào: <strong className="text-slate-800 font-mono">{log.inTime || '—'}</strong>
                      </div>
                      <div>
                        Thời gian:{' '}
                        <strong className={`font-black ${isOverTime ? 'text-rose-600' : 'text-slate-900'}`}>
                          {log.durationMinutes} phút
                        </strong>
                      </div>
                    </div>

                    {/* Cảnh báo vi phạm đỏ */}
                    {hasViolation && (
                      <div className="p-2 rounded-xl bg-rose-100/70 border border-rose-200 text-xs text-rose-800 space-y-0.5 font-medium">
                        {isOverTime && (
                          <div className="flex items-center gap-1 font-bold">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            <span>🚨 CẢNH BÁO: Ra ngoài {log.durationMinutes} phút (vượt quá quy định 15 phút)</span>
                          </div>
                        )}
                        {isOverFreq && (
                          <div className="flex items-center gap-1 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>⚠️ CẢNH BÁO: Ra ngoài lần thứ {log.timesInShift} trong ca (vượt định mức 3 lần/ca)</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {log.status === 'DANG_RA_NGOAI' && (
                        <button
                          onClick={() => handleEndBreak(log.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1"
                        >
                          <LogIn className="w-3.5 h-3.5" /> Xác Nhận Đã Quay Lại Ca
                        </button>
                      )}

                      {hasViolation && (
                        <button
                          onClick={() => {
                            setPenaltyEmployee(log.employeeName);
                            setPenaltyType(isOverTime ? 'Ra ngoài quá 15 phút không báo cáo' : 'Ra ngoài quá 3 lần trong một ca');
                            setPenaltyAmount(100000);
                            setPenaltyNote(`Vi phạm ra ngoài ${log.durationMinutes} phút (Lần thứ ${log.timesInShift}/ca)`);
                            setActiveTab('PENALTY');
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1"
                        >
                          Lập Biên Bản Phạt
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. TAB 3: GHI PHẠT VI PHẠM (SHEET PHAT - LIÊN KẾT TRỪ LƯƠNG)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'PENALTY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form lập biên bản phạt - 5 cột */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Lập Biên Bản Phạt Vi Phạm
                  </h3>
                  <p className="text-xs text-slate-500">Mẫu biểu chuẩn sheet PHAT (tự liên kết trừ lương)</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                Sheet PHAT
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nhân Viên Vi Phạm:</label>
                <select
                  value={penaltyEmployee}
                  onChange={(e) => setPenaltyEmployee(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {attendances.map((a) => (
                    <option key={a.id} value={a.fullName}>
                      {a.fullName} - {a.position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hành Vi / Lỗi Vi Phạm:</label>
                <select
                  value={penaltyType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPenaltyType(val);
                    // Gợi ý mức phạt chuẩn
                    if (val.includes('> 30 phút') || val.includes('GPS ngoài chi nhánh') || val.includes('Hút thuốc')) {
                      setPenaltyAmount(200000);
                    } else if (val.includes('đồng phục')) {
                      setPenaltyAmount(50000);
                    } else if (val.includes('vệ sinh an toàn') || val.includes('rơi vỡ')) {
                      setPenaltyAmount(150000);
                    } else {
                      setPenaltyAmount(100000);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Đi muộn không báo trước (> 15 phút)">Đi muộn không báo trước (&gt; 15 phút) - 100.000 đ</option>
                  <option value="Đi muộn nghiêm trọng (> 30 phút)">Đi muộn nghiêm trọng (&gt; 30 phút) - 200.000 đ</option>
                  <option value="Gian lận chấm công GPS ngoài chi nhánh (> 50m)">Gian lận chấm công GPS ngoài chi nhánh (&gt; 50m) - 200.000 đ</option>
                  <option value="Ra ngoài quá 15 phút không báo cáo">Ra ngoài quá 15 phút không báo cáo - 100.000 đ</option>
                  <option value="Ra ngoài quá 3 lần trong một ca">Ra ngoài quá 3 lần trong một ca - 100.000 đ</option>
                  <option value="Không mặc đúng đồng phục / Không đội mũ bếp">Không mặc đúng đồng phục / Không đội mũ bếp - 50.000 đ</option>
                  <option value="Vi phạm vệ sinh an toàn thực phẩm">Vi phạm vệ sinh an toàn thực phẩm - 150.000 đ</option>
                  <option value="Dùng điện thoại việc riêng trong giờ phục vụ">Dùng điện thoại việc riêng trong giờ phục vụ - 100.000 đ</option>
                  <option value="Hút thuốc không đúng nơi quy định">Hút thuốc không đúng nơi quy định - 200.000 đ</option>
                  <option value="Làm rơi vỡ dụng cụ / đổ thức ăn lãng phí">Làm rơi vỡ dụng cụ / đổ thức ăn lãng phí - 150.000 đ</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Số Tiền Phạt (VNĐ):</label>
                <div className="relative">
                  <input
                    type="number"
                    step="10000"
                    min="10000"
                    value={penaltyAmount}
                    onChange={(e) => setPenaltyAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-black text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 pr-10"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">đ</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi Chú / Bằng Chứng Vi Phạm:</label>
                <textarea
                  rows={2}
                  value={penaltyNote}
                  onChange={(e) => setPenaltyNote(e.target.value)}
                  placeholder="Ghi chú chi tiết hoặc camera ghi nhận..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <button
                onClick={handleCreatePenalty}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Ký Biên Bản & Ghi Nhận Phạt (Tự Động Trừ Lương)
              </button>
            </div>
          </div>

          {/* Danh sách biên bản phạt trong tháng - 7 cột */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Danh Sách Biên Bản Phạt Kỷ Luật
              </h3>
              <span className="text-xs text-slate-500 font-semibold">{penalties.length} biên bản</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {penalties.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200 space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-slate-500">{item.id}</span>
                      <h5 className="font-extrabold text-sm text-slate-900 mt-0.5">{item.employeeName}</h5>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white font-black text-xs shadow-xs">
                      -{item.fineAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="text-slate-800 font-medium">
                    Lỗi: <strong>{item.violationType}</strong>
                  </div>

                  {item.note && (
                    <div className="text-[11px] text-slate-600 italic bg-white/80 p-2 rounded-xl border border-rose-100">
                      &quot;{item.note}&quot;
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 pt-1 flex justify-between border-t border-rose-100">
                    <span>Người lập: {item.createdByName}</span>
                    <span className="text-emerald-700 font-bold">
                      ✓ Đã chuyển kế toán trừ lương tháng 11
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. TAB 4: CHẤM THI TAY NGHỀ (DAO THỚT & BÀN) & MỞ THI LẠI
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'SKILL_EXAM' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Chấm Thi - 5 cột */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Chấm Điểm Thi Tay Nghề
                  </h3>
                  <p className="text-xs text-slate-500">Đánh giá thực hành dao thớt & nghiệp vụ bàn</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
                Thang 100đ
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn Nhân Viên Thi:</label>
                <select
                  value={examEmployee}
                  onChange={(e) => setExamEmployee(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {attendances.map((a) => (
                    <option key={a.id} value={a.fullName}>
                      {a.fullName} - {a.position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Môn Thi Thực Hành:</label>
                <select
                  value={examSubject}
                  onChange={(e) => setExamSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Dao thớt & Sơ chế Cá hồi Nauy">1. Dao thớt & Sơ chế Cá hồi Nauy (Bếp)</option>
                  <option value="Pha lóc Ba chỉ bò & Cua ghẹ sống">2. Pha lóc Ba chỉ bò & Cua ghẹ sống (Bếp)</option>
                  <option value="Nấu nước dùng lẩu & Định mức gia vị">3. Nấu nước dùng lẩu & Định mức gia vị (Bếp)</option>
                  <option value="Nghiệp vụ Order & Bày line Buffet">4. Nghiệp vụ Order & Bày line Buffet (Phục vụ bàn)</option>
                  <option value="Quy trình thanh toán & Xuất hóa đơn CukCuk">5. Quy trình thanh toán & Xuất hóa đơn CukCuk (Thu ngân)</option>
                </select>
              </div>

              {/* 3 Tiêu chí điểm */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <span className="font-extrabold text-slate-800 block text-[11px] uppercase tracking-wider">
                  Chấm 3 Tiêu Chí Đánh Giá
                </span>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>1. Kỹ thuật dao & thành phẩm (Tối đa 40đ):</span>
                    <strong className="text-indigo-700">{cutScoreInput} đ</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    value={cutScoreInput}
                    onChange={(e) => setCutScoreInput(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>2. Vệ sinh thớt & an toàn VSATTP (Tối đa 30đ):</span>
                    <strong className="text-indigo-700">{hygieneScoreInput} đ</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={hygieneScoreInput}
                    onChange={(e) => setHygieneScoreInput(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>3. Tốc độ & định mức hao hụt (Tối đa 30đ):</span>
                    <strong className="text-indigo-700">{speedScoreInput} đ</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={speedScoreInput}
                    onChange={(e) => setSpeedScoreInput(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-800">Tổng điểm bài thi:</span>
                  <span
                    className={`text-base font-black ${
                      cutScoreInput + hygieneScoreInput + speedScoreInput >= 75
                        ? 'text-emerald-700'
                        : 'text-rose-600'
                    }`}
                  >
                    {cutScoreInput + hygieneScoreInput + speedScoreInput} / 100 điểm ({cutScoreInput + hygieneScoreInput + speedScoreInput >= 75 ? 'ĐẠT' : 'CHƯA ĐẠT'})
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nhận Xét / Đánh Giá:</label>
                <textarea
                  rows={2}
                  value={examNoteInput}
                  onChange={(e) => setExamNoteInput(e.target.value)}
                  placeholder="Nhận xét kỹ năng thực hành của nhân viên..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <button
                onClick={handleScoreExam}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" /> Lưu Kết Quả Chấm Thi
              </button>
            </div>
          </div>

          {/* Lịch Sử Chấm Thi & Nút Mở Thi Lại - 7 cột */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Bảng Kết Quả Thi Tay Nghề
              </h3>
              <span className="text-xs text-slate-500 font-semibold">{exams.length} bài thi</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {exams.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2 text-xs ${
                    item.isPassed
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-extrabold text-sm text-slate-900">{item.employeeName}</h5>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                          {item.position}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700 mt-0.5 block">
                        Môn thi: {item.subject}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-black shadow-xs inline-block ${
                          item.isPassed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {item.totalScore} / 100 ({item.isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'})
                      </span>
                    </div>
                  </div>

                  {/* Chi tiết 3 điểm */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] bg-white p-2 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Dao thớt</span>
                      <span className="font-bold text-slate-800">{item.cutScore}/40</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Vệ sinh</span>
                      <span className="font-bold text-slate-800">{item.hygieneScore}/30</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tốc độ</span>
                      <span className="font-bold text-slate-800">{item.speedScore}/30</span>
                    </div>
                  </div>

                  {item.note && (
                    <div className="text-[11px] text-slate-600 italic">
                      &quot;{item.note}&quot;
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 pt-2 flex items-center justify-between border-t border-slate-200/60">
                    <span>Chấm bởi: {item.evaluatorName} • {item.evaluatedAt}</span>

                    {/* Nút Mở Quyền Thi Lại cho nhân viên trượt */}
                    {!item.isPassed && (
                      <button
                        onClick={() => handleAllowRetake(item.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          item.canRetake
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                        }`}
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        {item.canRetake ? '✓ Đã Mở Quyền Thi Lại' : 'Mở Quyền Thi Lại'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. TAB 5: ĐỐI SOÁT MẺ NẤU & CHỐNG GIAN LẬN CÂN BÀN (TASK-WH-05)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'BATCH_AUDIT' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-600" />
                Đối Soát Mẻ Chế Biến & Soi Ảnh Mặt Cân Điện Tử
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-black">
                  Chống Gian Lận Thất Thoát
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Quản lý chi nhánh kiểm tra tính trung thực của Bếp: so sánh số kg thành phẩm khai báo với ảnh chụp bàn cân và định mức chuẩn
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {batches.length} Mẻ ca này
              </span>
              {overStandardBatchCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-extrabold flex items-center gap-1 shadow-sm animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {overStandardBatchCount} Mẻ Vượt Định Mức
                </span>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[980px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] bg-slate-50/60">
                  <th className="py-2.5 px-3">Mã Mẻ</th>
                  <th className="py-2.5 px-2">Người Nấu</th>
                  <th className="py-2.5 px-2">Món Chế Biến</th>
                  <th className="py-2.5 px-2 text-right">Đầu Vào</th>
                  <th className="py-2.5 px-2 text-right">Thành Phẩm</th>
                  <th className="py-2.5 px-2 text-right">% Hụt Thực Tế</th>
                  <th className="py-2.5 px-2 text-right">% Chuẩn</th>
                  <th className="py-2.5 px-2 text-right">Chênh Lệch</th>
                  <th className="py-2.5 px-2 text-center">Ảnh Bàn Cân</th>
                  <th className="py-2.5 px-2">Trạng Thái & Cảnh Báo</th>
                  <th className="py-2.5 px-3 text-center">Thao Tác Quản Lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((batch) => {
                  const isOver = batch.overStandard;
                  const diff =
                    batch.lossRate !== undefined && batch.lossRate !== null
                      ? Number((batch.lossRate - batch.standardLossRate).toFixed(1))
                      : null;

                  return (
                    <tr
                      key={batch.id}
                      className={`transition-colors ${
                        isOver
                          ? 'bg-rose-50/80 hover:bg-rose-100/70 border-l-4 border-l-rose-600'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-800 block">{batch.batchCode}</span>
                        <span className="text-[10px] text-slate-400">{batch.startedAt?.slice(5, 16)}</span>
                      </td>
                      <td className="py-3 px-2 font-medium text-slate-800">
                        {batch.chefName || batch.startedBy || 'Nguyễn Văn Bếp'}
                      </td>
                      <td className="py-3 px-2 font-bold text-slate-900">
                        {batch.itemName}
                        {batch.itemCode && (
                          <span className="text-[10px] text-slate-400 block font-mono font-normal">
                            {batch.itemCode}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right font-semibold text-slate-700">
                        {batch.inputWeight} kg
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-slate-900">
                        {batch.outputWeight ? (
                          `${batch.outputWeight} kg`
                        ) : (
                          <span className="text-amber-600 italic">Đang nấu...</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {batch.lossRate !== undefined && batch.lossRate !== null ? (
                          <span className={`font-black ${isOver ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {batch.lossRate}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-2 text-right font-semibold text-slate-500">
                        {batch.standardLossRate}%
                      </td>
                      <td className="py-3 px-2 text-right">
                        {diff !== null ? (
                          <span
                            className={`font-black ${
                              diff > 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-600'
                            }`}
                          >
                            {diff > 0 ? `+${diff}%` : `${diff}%`}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {batch.scalePhotoUrl ? (
                          <div className="flex flex-col items-center gap-1">
                            <div
                              onClick={() => {
                                setSelectedScalePhoto({ photoUrl: batch.scalePhotoUrl!, batch });
                                setZoomLevel(1);
                              }}
                              className="relative w-14 h-10 rounded-lg overflow-hidden border border-slate-300 shadow-xs cursor-pointer hover:ring-2 hover:ring-blue-500 group transition-all shrink-0 bg-slate-900"
                            >
                              <img
                                src={batch.scalePhotoUrl}
                                alt="Bàn cân"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ZoomIn className="w-4 h-4 text-white" />
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedScalePhoto({ photoUrl: batch.scalePhotoUrl!, batch });
                                setZoomLevel(1);
                              }}
                              className="text-[10px] text-blue-700 hover:text-blue-900 font-bold underline flex items-center gap-0.5"
                            >
                              <Eye className="w-3 h-3" /> Soi cận cảnh
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Chưa có ảnh</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {batch.status === 'DANG_LAM' ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            🟡 Đang làm
                          </span>
                        ) : isOver ? (
                          <div className="p-1.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-extrabold flex items-center gap-1 shadow-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Vượt định mức +{diff}% - Nguy cơ ăn bớt nguyên liệu!</span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1 w-fit">
                            <Check className="w-3 h-3" /> Đạt chuẩn
                          </span>
                        )}

                        {/* Approval badge */}
                        {batch.approvalStatus === 'HOP_LE' && (
                          <span className="mt-1 block text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit">
                            ✅ Hợp lệ ({batch.approvedBy || 'Quản lý'})
                          </span>
                        )}
                        {batch.approvalStatus === 'BIEN_BAN' && (
                          <span className="mt-1 block text-[10px] text-amber-900 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-fit">
                            ⚠️ Đã lập biên bản: {batch.approvalNote || 'Giải trình hao hụt'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {batch.status === 'HOAN_THANH' ? (
                          <div className="flex flex-col gap-1 items-center justify-center">
                            <button
                              onClick={() => handleApproveBatch(batch)}
                              disabled={isSubmittingApproval || batch.approvalStatus === 'HOP_LE'}
                              className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Xác nhận hợp lệ</span>
                            </button>
                            <button
                              onClick={() => handleOpenExplanationModal(batch)}
                              disabled={isSubmittingApproval}
                              className="w-full py-1.5 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Lập biên bản giải trình</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Đang nấu</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          LIGHTBOX ZOOM HD SOI ẢNH BÀN CÂN ĐIỆN TỬ (TASK-WH-05)
      ───────────────────────────────────────────────────────────── */}
      {selectedScalePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 animate-in fade-in"
          onClick={() => setSelectedScalePhoto(null)}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between pb-3 border-b border-slate-800 text-white shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500 text-white font-black">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                  Quản Lý Soi Cận Cảnh Ảnh Bàn Cân: {selectedScalePhoto.batch.batchCode}
                  {selectedScalePhoto.batch.overStandard && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                      VƯỢT ĐỊNH MỨC
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-400">
                  Món: <strong className="text-white">{selectedScalePhoto.batch.itemName}</strong> | Đầu vào: {selectedScalePhoto.batch.inputWeight} kg | Khai báo thành phẩm: <strong className="text-emerald-400 font-mono text-sm">{selectedScalePhoto.batch.outputWeight} kg</strong>
                </p>
              </div>
            </div>

            {/* Zoom controls & close */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 text-xs font-mono font-bold text-blue-400">{Math.round(zoomLevel * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100))}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Phóng to"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold"
                  title="Đặt lại 100%"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => setSelectedScalePhoto(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body image */}
          <div
            className="flex-1 overflow-auto flex items-center justify-center p-4 my-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
              className="origin-center shadow-2xl rounded-2xl overflow-hidden border border-slate-700 bg-black"
            >
              <img
                src={selectedScalePhoto.photoUrl}
                alt="Ảnh bàn cân điện tử HD"
                className="max-h-[75vh] w-auto object-contain select-none"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs text-slate-400">
              💡 <em>Phóng to cận cảnh mặt đồng hồ số điện tử để kiểm tra tính trung thực, đối chiếu với số cân nhân viên đã gõ.</em>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApproveBatch(selectedScalePhoto.batch)}
                disabled={isSubmittingApproval || selectedScalePhoto.batch.approvalStatus === 'HOP_LE'}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Check className="w-4 h-4" />
                <span>Xác Nhận Mẻ Hợp Lệ</span>
              </button>
              <button
                onClick={() => handleOpenExplanationModal(selectedScalePhoto.batch)}
                disabled={isSubmittingApproval}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <FileText className="w-4 h-4" />
                <span>Lập Biên Bản Giải Trình</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL LẬP BIÊN BẢN GIẢI TRÌNH HAO HỤT & PHẠT (TASK-WH-05)
      ───────────────────────────────────────────────────────────── */}
      {explanationBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-rose-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <FileText className="w-5 h-5" />
                <h4 className="font-bold text-base text-slate-900">
                  Biên Bản Giải Trình & Xử Lý Hao Hụt #{explanationBatch.batchCode}
                </h4>
              </div>
              <button onClick={() => setExplanationBatch(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Món chế biến:</span>
                <strong className="text-slate-900">{explanationBatch.itemName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Đầu bếp thực hiện:</span>
                <strong className="text-slate-900">{explanationBatch.chefName || explanationBatch.startedBy || 'Nguyễn Văn Bếp'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Đầu vào / Thành phẩm:</span>
                <strong className="text-slate-900 font-mono">
                  {explanationBatch.inputWeight} kg $\rightarrow$ {explanationBatch.outputWeight || '—'} kg
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hao hụt thực tế vs Định mức chuẩn:</span>
                <strong className="text-rose-600 font-bold">
                  {explanationBatch.lossRate}% (Chuẩn: {explanationBatch.standardLossRate}%)
                </strong>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Nội dung biên bản giải trình:
              </label>
              <textarea
                rows={3}
                value={explanationNote}
                onChange={(e) => setExplanationNote(e.target.value)}
                placeholder="Nhập nội dung biên bản giải trình..."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Checkbox phạt vi phạm trừ lương */}
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alsoRecordPenalty}
                  onChange={(e) => setAlsoRecordPenalty(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-rose-900">
                  Đồng thời lập biên bản phạt trừ lương (Quy chế chống gian lận & thất thoát)
                </span>
              </label>

              {alsoRecordPenalty && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-rose-200">
                  <span className="text-slate-600 font-medium">Số tiền phạt:</span>
                  <select
                    value={batchPenaltyAmount}
                    onChange={(e) => setBatchPenaltyAmount(Number(e.target.value))}
                    className="p-1.5 rounded-lg border border-rose-300 bg-white font-bold text-rose-700 text-xs"
                  >
                    <option value={50000}>50.000 đ (Nhắc nhở nhẹ)</option>
                    <option value={100000}>100.000 đ (Vượt chuẩn lần đầu)</option>
                    <option value={200000}>200.000 đ (Tái phạm nhiều lần)</option>
                    <option value={500000}>500.000 đ (Nghi vấn ăn bớt nguyên liệu)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setExplanationBatch(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveExplanation}
                disabled={isSubmittingApproval || !explanationNote.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-xl flex items-center gap-1 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Lưu Biên Bản {alsoRecordPenalty ? '& Lập Phạt' : ''}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManagerCenter;
