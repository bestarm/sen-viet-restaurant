import { db } from '../db/schema';
import { simulateLatency, initializeDatabaseIfEmpty } from '../db/dbService';

export interface Attendance {
  id: number;
  userId: number;
  fullName: string;
  username: string;
  branchId: number;
  branchName: string;
  attendanceDate: string;
  shiftName: string;
  checkInTime: string;
  checkInSelfieUrl?: string;
  checkInDistanceMeters: number;
  isValidLocation: boolean;
  lateMinutes: number;
  checkOutTime?: string;
  checkOutSelfieUrl?: string;
  checkOutDistanceMeters?: number;
  earlyMinutes?: number;
  workShiftHours: number;
  actualHours: number;
  status: string; // 'DANG_LAM', 'HOAN_THANH', 'VI_PHAM_KHOANG_CACH'
}

export interface CheckInRequest {
  shiftName: string;
  selfieUrl: string;
  latitude: number;
  longitude: number;
}

export interface CheckOutRequest {
  selfieUrl: string;
  latitude: number;
  longitude: number;
}

export interface ExamQuestion {
  id: number;
  position: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  points: number;
  correctOption?: string;
}

export interface ExamSubmitRequest {
  examQuarter: string;
  startedAt?: string;
  answers: Record<string, string>;
}

export interface ExamSubmission {
  id: number;
  userId: number;
  fullName: string;
  examQuarter: string;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  theoryScore: number;
  practicalScore?: number;
  totalScore: number;
  practicalComment?: string;
  status: string;
  isPassed: boolean;
}

export interface GradePracticalRequest {
  practicalScore: number;
  comment: string;
}

export interface UniformItem {
  id: number;
  itemName: string;
  depositValue: number;
}

export interface UniformAllocation {
  id: number;
  uniformItemId: number;
  uniformItemName: string;
  depositValue: number;
  allocatedDate: string;
  isReturned: boolean;
  returnedDate?: string;
  note?: string;
}

export interface ResignationRequest {
  id: number;
  user: {
    id: number;
    username: string;
    fullName: string;
    phone?: string;
  };
  branch: {
    id: number;
    branchCode: string;
    branchName: string;
  };
  requestDate: string;
  reason: string;
  isAbandoned: boolean;
  status: string; // 'CHO_DUYET', 'DA_DUYET', 'DANG_GIU_LUONG', 'HOAN_TAT', 'BO_VIEC', 'CANCELLED'
  missingUniformDetails?: string;
  managerNote?: string;
  approvedByUser?: {
    id: number;
    fullName: string;
  };
  approvedAt?: string;
  cancelledByUser?: {
    id: number;
    fullName: string;
  };
  cancelledAt?: string;
  da_thu_hoi_dong_phuc?: boolean;
}

export interface UniformReturnRequest {
  returnedAllocationIds: number[];
  note?: string;
  managerNote?: string;
  da_thu_hoi_dong_phuc?: boolean;
}

export interface AbandonmentScanResult {
  scanDate: string;
  totalUsersScanned: number;
  suspectedAbandonmentCount: number;
  suspectedUsers: Array<{
    userId: number;
    username: string;
    fullName: string;
    branchName: string;
    consecutiveDaysAbsent: number;
    suggestion: string;
  }>;
}

// Hàm tính khoảng cách GPS Haversine (mét)
function calculateHaversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const hrApi = {
  // Attendance
  checkIn: async (data: CheckInRequest): Promise<Attendance> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 180);

    const savedUserId = Number(localStorage.getItem('senviet_demo_user_id') || 1);
    const user = (await db.users.get(savedUserId)) || (await db.users.get(1));
    const branch = (user?.branchId ? await db.branches.get(user.branchId) : null) || (await db.branches.get(1));

    const branchLat = branch?.latitude || 21.5928;
    const branchLon = branch?.longitude || 105.8442;

    const distance = calculateHaversineMeters(data.latitude, data.longitude, branchLat, branchLon);
    const isValidLocation = distance <= 50; // Chuẩn Geofence 50m
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const newAttendance: Attendance = {
      id: Date.now(),
      userId: user?.id || 1,
      fullName: user?.fullName || 'Nguyễn Văn Bếp',
      username: user?.username || 'bep_tn',
      branchId: branch?.id || 1,
      branchName: branch?.name || 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      attendanceDate: todayStr,
      shiftName: data.shiftName || 'Ca Sáng (08:00 - 16:30)',
      checkInTime: now.toISOString(),
      checkInSelfieUrl: data.selfieUrl,
      checkInDistanceMeters: distance,
      isValidLocation,
      lateMinutes: 0,
      workShiftHours: 8.0,
      actualHours: 8.0,
      status: isValidLocation ? 'DANG_LAM' : 'VI_PHAM_KHOANG_CACH',
    };

    await db.attendances.add(newAttendance);
    return newAttendance;
  },

  checkOut: async (data: CheckOutRequest): Promise<Attendance> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 180);

    const savedUserId = Number(localStorage.getItem('senviet_demo_user_id') || 1);
    const list = await db.attendances.toArray();
    const existing = list.find((a) => a.userId === savedUserId && a.status === 'DANG_LAM');

    const now = new Date().toISOString();
    if (existing) {
      const updated = {
        ...existing,
        checkOutTime: now,
        checkOutSelfieUrl: data.selfieUrl,
        status: 'HOAN_THANH',
      };
      await db.attendances.put(updated);
      return updated;
    }

    const fallback: Attendance = {
      id: Date.now(),
      userId: savedUserId,
      fullName: 'Nhân viên Demo',
      username: 'demo_user',
      branchId: 1,
      branchName: 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      attendanceDate: now.slice(0, 10),
      shiftName: 'Ca Sáng',
      checkInTime: now,
      checkOutTime: now,
      checkInDistanceMeters: 5,
      isValidLocation: true,
      lateMinutes: 0,
      workShiftHours: 8.0,
      actualHours: 8.0,
      status: 'HOAN_THANH',
    };
    return fallback;
  },

  getTodayAttendances: async (branchId?: number): Promise<Attendance[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    let list = await db.attendances.toArray();
    if (branchId) {
      list = list.filter((a) => a.branchId === branchId);
    }
    return list.reverse();
  },

  getMyAttendanceHistory: async (): Promise<Attendance[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const savedUserId = Number(localStorage.getItem('senviet_demo_user_id') || 1);
    const list = await db.attendances.toArray();
    return list.filter((a) => a.userId === savedUserId).reverse();
  },

  scanAbandonment: async (): Promise<AbandonmentScanResult> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 160);

    return {
      scanDate: new Date().toISOString().slice(0, 10),
      totalUsersScanned: 10,
      suspectedAbandonmentCount: 1,
      suspectedUsers: [
        {
          userId: 10,
          fullName: 'Ngô Văn Nghỉ Việc',
          username: 'nv_nghiviec_tn',
          branchName: 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
          consecutiveDaysAbsent: 5,
          suggestion: 'Đã nghỉ việc không phép 5 ngày liên tiếp — Đề xuất giữ lương theo quy chế đồng phục',
        },
      ],
    };
  },

  confirmAbandonment: async (userId: number): Promise<ResignationRequest> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 160);

    const user = await db.users.get(userId);
    const res: ResignationRequest = {
      id: Date.now(),
      user: {
        id: userId,
        username: user?.username || 'unknown',
        fullName: user?.fullName || 'Nhân viên bỏ việc',
        phone: user?.phone,
      },
      branch: {
        id: user?.branchId || 1,
        branchCode: user?.branchCode || 'TN',
        branchName: user?.branchName || 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      },
      requestDate: new Date().toISOString().slice(0, 10),
      reason: 'Tự ý bỏ việc không thông báo',
      isAbandoned: true,
      status: 'BO_VIEC',
      missingUniformDetails: 'Đang giữ lương do chưa bàn giao lại đồng phục (thiếu 1 Tạp dề, 1 Nón bếp)',
      managerNote: 'Tự ý bỏ việc không thông báo',
      da_thu_hoi_dong_phuc: false,
    };

    await db.resignationRequests.add(res);
    return res;
  },

  cancelAbandonment: async (id: number): Promise<ResignationRequest> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);

    const existing = await db.resignationRequests.get(id);
    if (existing) {
      const updated = { ...existing, status: 'CANCELLED' };
      await db.resignationRequests.put(updated);
      return updated;
    }
    throw new Error('Không tìm thấy bản ghi');
  },

  // Exam
  getExamQuestions: async (position = 'BEP'): Promise<ExamQuestion[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const list = await db.examQuestions.toArray();
    return list.filter((q) => q.position === position || !q.position);
  },

  submitExam: async (data: ExamSubmitRequest): Promise<ExamSubmission> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 180);

    const savedUserId = Number(localStorage.getItem('senviet_demo_user_id') || 1);
    const user = (await db.users.get(savedUserId)) || (await db.users.get(1));
    const questions = await db.examQuestions.toArray();

    let correctCount = 0;
    Object.entries(data.answers || {}).forEach(([qId, ans]) => {
      const q = questions.find((item) => String(item.id) === String(qId));
      if (q && q.correctOption === ans) {
        correctCount++;
      }
    });

    const theoryScore = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 100;
    const now = new Date().toISOString();

    const submission: ExamSubmission = {
      id: Date.now(),
      userId: user?.id || 1,
      fullName: user?.fullName || 'Nguyễn Văn Bếp',
      examQuarter: data.examQuarter || 'Q4-2026',
      startedAt: data.startedAt || now,
      submittedAt: now,
      durationSeconds: 900,
      theoryScore,
      practicalScore: 92,
      totalScore: Math.round((theoryScore + 92) / 2),
      isPassed: theoryScore >= 75,
      status: 'DA_CHAM_DIEM',
      practicalComment: 'Kỹ năng thái lát bò và chế biến hải sản đồng đều, đạt chuẩn định mức',
    };

    await db.examSubmissions.add(submission);
    return submission;
  },

  getBranchSubmissions: async (branchId?: number): Promise<ExamSubmission[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    let list = await db.examSubmissions.toArray();
    if (branchId) {
      list = list.filter((s) => !s.branchId || s.branchId === branchId);
    }
    return list.map((s) => ({
      ...s,
      isPassed: s.isPassed !== undefined ? s.isPassed : s.theoryScore >= 75,
      examQuarter: s.examQuarter || 'Q4-2026',
    })).reverse();
  },

  getMySubmissions: async (): Promise<ExamSubmission[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const savedUserId = Number(localStorage.getItem('senviet_demo_user_id') || 1);
    const list = await db.examSubmissions.toArray();
    return list
      .filter((s) => s.userId === savedUserId)
      .map((s) => ({
        ...s,
        isPassed: s.isPassed !== undefined ? s.isPassed : s.theoryScore >= 75,
        examQuarter: s.examQuarter || 'Q4-2026',
      }))
      .reverse();
  },

  gradePractical: async (id: number, data: GradePracticalRequest): Promise<ExamSubmission> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 160);

    const existing = await db.examSubmissions.get(id);
    if (!existing) throw new Error('Không tìm thấy bài thi');

    const totalScore = Math.round((existing.theoryScore + data.practicalScore) / 2);
    const updated: ExamSubmission = {
      ...existing,
      practicalScore: data.practicalScore,
      totalScore,
      isPassed: totalScore >= 75,
      practicalComment: data.comment,
      status: 'DA_CHAM_DIEM',
    };

    await db.examSubmissions.put(updated);
    return updated;
  },

  // Uniform & Resignation
  getUniformItems: async (): Promise<UniformItem[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);
    const list = await db.uniformItems.toArray();
    return list.map((u) => ({
      id: u.id,
      itemName: u.itemName,
      depositValue: u.depositValue || u.depositPrice || 100000,
    }));
  },

  getMyUniformAllocations: async (): Promise<UniformAllocation[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const savedUserId = Number(localStorage.getItem('senviet_demo_user_id') || 1);
    const list = await db.uniformAllocations.toArray();
    return list
      .filter((u) => u.userId === savedUserId)
      .map((u) => ({
        id: u.id,
        uniformItemId: u.uniformItemId,
        uniformItemName: u.uniformItemName || u.uniformName || 'Đồng phục',
        depositValue: u.depositValue || 120000,
        allocatedDate: u.allocatedDate || '2026-06-01',
        isReturned: u.isReturned || false,
        returnedDate: u.returnedDate,
        note: u.note,
      }));
  },

  getUserUniformAllocations: async (userId: number): Promise<UniformAllocation[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const list = await db.uniformAllocations.toArray();
    return list
      .filter((u) => u.userId === userId)
      .map((u) => ({
        id: u.id,
        uniformItemId: u.uniformItemId,
        uniformItemName: u.uniformItemName || u.uniformName || 'Đồng phục',
        depositValue: u.depositValue || 120000,
        allocatedDate: u.allocatedDate || '2026-06-01',
        isReturned: u.isReturned || false,
        returnedDate: u.returnedDate,
        note: u.note,
      }));
  },

  getResignationRequests: async (branchId?: number): Promise<ResignationRequest[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    let list = await db.resignationRequests.toArray();
    if (branchId) {
      list = list.filter((r) => !r.branch?.id || r.branch.id === branchId || r.branchId === branchId);
    }
    return list.map((r) => ({
      id: r.id,
      user: r.user || {
        id: r.userId || 10,
        username: r.username || 'nv_nghiviec_tn',
        fullName: r.fullName || 'Ngô Văn Nghỉ Việc',
      },
      branch: r.branch || {
        id: r.branchId || 1,
        branchCode: 'TN',
        branchName: r.branchName || 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      },
      requestDate: r.requestDate || r.resignationDate || '2026-11-15',
      reason: r.reason || 'Nghỉ việc',
      isAbandoned: r.isAbandoned || false,
      status: r.status || 'DANG_GIU_LUONG',
      missingUniformDetails: r.missingUniformDetails || r.missingUniformNote || 'Thiếu 1 Tạp dề, 1 Nón bếp',
      managerNote: r.managerNote,
      da_thu_hoi_dong_phuc: r.da_thu_hoi_dong_phuc,
    })).reverse();
  },

  getMyResignations: async (): Promise<ResignationRequest[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const savedUserId = Number(localStorage.getItem('senviet_demo_user_id') || 1);
    const list = await hrApi.getResignationRequests();
    return list.filter((r) => r.user.id === savedUserId);
  },

  submitResignation: async (reason?: string): Promise<ResignationRequest> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 180);

    const savedUserId = Number(localStorage.getItem('senviet_demo_user_id') || 1);
    const user = (await db.users.get(savedUserId)) || (await db.users.get(1));

    const newReq: ResignationRequest = {
      id: Date.now(),
      user: {
        id: user?.id || 1,
        username: user?.username || 'bep_tn',
        fullName: user?.fullName || 'Nguyễn Văn Bếp',
        phone: user?.phone,
      },
      branch: {
        id: user?.branchId || 1,
        branchCode: user?.branchCode || 'TN',
        branchName: user?.branchName || 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      },
      requestDate: new Date().toISOString().slice(0, 10),
      reason: reason || 'Lý do cá nhân',
      isAbandoned: false,
      status: 'CHO_DUYET',
      da_thu_hoi_dong_phuc: false,
    };

    await db.resignationRequests.add(newReq);
    return newReq;
  },

  verifyChecklist: async (id: number, data: UniformReturnRequest): Promise<ResignationRequest> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 180);

    const existing = await db.resignationRequests.get(id);
    if (!existing) throw new Error('Không tìm thấy đơn nghỉ việc');

    const isFullyReturned = data.da_thu_hoi_dong_phuc !== undefined ? data.da_thu_hoi_dong_phuc : true;

    const updated: ResignationRequest = {
      ...existing,
      da_thu_hoi_dong_phuc: isFullyReturned,
      status: isFullyReturned ? 'HOAN_TAT' : 'DANG_GIU_LUONG',
      missingUniformDetails: isFullyReturned ? 'Đã thu hồi đủ đồng phục' : data.note || 'Còn thiếu đồng phục',
      managerNote: data.note,
    };

    await db.resignationRequests.put(updated);

    // Mở khóa lương tương ứng nếu đã thu hồi đủ đồng phục
    if (isFullyReturned) {
      const payrolls = await db.payrollRecords.toArray();
      const userId = existing.user?.id || existing.userId;
      const userPayroll = payrolls.find((p) => p.userId === userId);
      if (userPayroll) {
        await db.payrollRecords.update(userPayroll.id, {
          isPaid: true,
          status: 'DA_THANH_TOAN',
          holdReason: '✅ Đã hoàn tất thu hồi đồng phục — Cho phép thanh toán lương',
        });
      }
    }

    return updated;
  },
};
