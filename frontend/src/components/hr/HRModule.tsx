import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Camera,
  Award,
  Shirt,
  UserCheck,
  UserX,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ExternalLink,
  RotateCcw,
  Upload
} from 'lucide-react';
import { PermissionGuideModal } from '../common/PermissionGuideModal';
import {
  hrApi,
  Attendance,
  ExamQuestion,
  ExamSubmission,
  UniformAllocation,
  ResignationRequest,
  AbandonmentScanResult
} from '../../api/hr';
import { User, RoleName } from '../../types/auth';
import { getUsersApi, assignUserRolesApi } from '../../api/auth';
import { useNotification } from '../../context/NotificationContext';

interface HRModuleProps {
  currentUser?: User | null;
}

export const HRModule: React.FC<HRModuleProps> = ({ currentUser }) => {
  const { showError, showSuccess, showWarning } = useNotification();
  const [activeTab, setActiveTab] = useState<'attendance' | 'exam' | 'uniform' | 'roles'>('attendance');
  const [loading, setLoading] = useState(false);
  const [message, setInternalMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const setMessage = (msg: { text: string; type: 'success' | 'error' | 'warning' } | null) => {
    setInternalMessage(msg);
    if (!msg) return;
    if (msg.type === 'error') {
      showError(msg.text, 'LỖI NHÂN SỰ & CHẤM CÔNG');
    } else if (msg.type === 'warning') {
      showWarning(msg.text, 'CẢNH BÁO NHÂN SỰ');
    } else {
      showSuccess(msg.text, 'THAO TÁC NHÂN SỰ THÀNH CÔNG');
    }
  };

  // Tab 4: Multi-Role RBAC Management state (Phase 9)
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [editingRolesUser, setEditingRolesUser] = useState<User | null>(null);
  const [selectedUserRoles, setSelectedUserRoles] = useState<string[]>([]);
  const [isSavingRoles, setIsSavingRoles] = useState<boolean>(false);

  // Tab 1: Attendance state
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [shiftName, setShiftName] = useState('Ca Sáng (08:00 - 16:00)');
  const [currentLat, setCurrentLat] = useState<number>(21.5927);
  const [currentLon, setCurrentLon] = useState<number>(105.8442);
  const [distanceMeters, setDistanceMeters] = useState<number>(0);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reference branch coordinates: Thai Nguyen by default (21.5927, 105.8442) or Que Vo (21.1485, 106.1624)
  const branchCoords = currentUser?.branchId === 2
    ? { lat: 21.1485, lon: 106.1624, name: 'Quế Võ' }
    : { lat: 21.5927, lon: 105.8442, name: 'Thái Nguyên' };

  // Tab 2: Exam state
  const [examPosition, setExamPosition] = useState<'BEP' | 'PHUC_VU'>('BEP');
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [examStarted, setExamStarted] = useState(false);
  const [examTimer, setExamTimer] = useState(900); // 15 mins
  const [mySubmissions, setMySubmissions] = useState<ExamSubmission[]>([]);
  const [branchSubmissions, setBranchSubmissions] = useState<ExamSubmission[]>([]);
  const [gradingSubmission, setGradingSubmission] = useState<ExamSubmission | null>(null);
  const [practicalScoreInput, setPracticalScoreInput] = useState<number>(85);
  const [practicalCommentInput, setPracticalCommentInput] = useState<string>('Thao tác chuẩn, vệ sinh an toàn thực phẩm tốt');

  // Tab 3: Uniform & Resignation state
  const [myAllocations, setMyAllocations] = useState<UniformAllocation[]>([]);
  const [resignationRequests, setResignationRequests] = useState<ResignationRequest[]>([]);
  const [resignationReason, setResignationReason] = useState('');
  const [abandonmentResult, setAbandonmentResult] = useState<AbandonmentScanResult | null>(null);
  const [verifyingResignation, setVerifyingResignation] = useState<ResignationRequest | null>(null);
  const [employeeAllocations, setEmployeeAllocations] = useState<UniformAllocation[]>([]);
  const [selectedReturnIds, setSelectedReturnIds] = useState<number[]>([]);
  const [managerNoteInput, setManagerNoteInput] = useState<string>('');

  // Hardware Permissions UX (Phase 11)
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);
  const [permissionModalType, setPermissionModalType] = useState<'CAMERA' | 'GEOLOCATION'>('GEOLOCATION');
  const selfieFileInputRef = useRef<HTMLInputElement>(null);

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

  // Haversine distance calculator for client preview
  const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  useEffect(() => {
    const dist = calcDistance(currentLat, currentLon, branchCoords.lat, branchCoords.lon);
    setDistanceMeters(dist);
  }, [currentLat, currentLon, branchCoords.lat, branchCoords.lon]);

  // Initial load
  useEffect(() => {
    loadAttendanceData();
    loadExamData();
    loadUniformData();
  }, [activeTab]);

  // Countdown timer for exam
  useEffect(() => {
    let interval: any = null;
    if (examStarted && examTimer > 0) {
      interval = setInterval(() => setExamTimer(t => t - 1), 1000);
    } else if (examTimer === 0 && examStarted) {
      handleAutoSubmitExam();
    }
    return () => clearInterval(interval);
  }, [examStarted, examTimer]);

  const loadAttendanceData = async () => {
    try {
      const list = await hrApi.getTodayAttendances(currentUser?.branchId || undefined);
      setAttendances(list);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Giai đoạn 9: Quản lý phân quyền đa vai trò
  const loadUsersData = async () => {
    try {
      const users = await getUsersApi();
      setAllUsers(users);
    } catch (err: any) {
      console.error('Lỗi khi nạp danh sách tài khoản phân quyền:', err);
    }
  };

  const handleOpenEditRoles = (u: User) => {
    setEditingRolesUser(u);
    setSelectedUserRoles((u.roles as string[]) || []);
  };

  const handleToggleRole = (role: string) => {
    if (selectedUserRoles.includes(role)) {
      setSelectedUserRoles(selectedUserRoles.filter((r) => r !== role));
    } else {
      setSelectedUserRoles([...selectedUserRoles, role]);
    }
  };

  const handleSaveUserRoles = async () => {
    if (!editingRolesUser) return;
    if (selectedUserRoles.length === 0) {
      setMessage({ text: 'Người dùng phải có ít nhất 1 vai trò', type: 'error' });
      return;
    }

    try {
      setIsSavingRoles(true);
      await assignUserRolesApi(editingRolesUser.id, selectedUserRoles);
      setMessage({
        text: `✅ Đã cập nhật vai trò cho người dùng "${editingRolesUser.fullName}" thành công!`,
        type: 'success',
      });
      setEditingRolesUser(null);
      loadUsersData();
    } catch (err: any) {
      console.error('Lỗi gán vai trò:', err);
      setMessage({ text: err.response?.data?.message || 'Không thể gán vai trò người dùng', type: 'error' });
    } finally {
      setIsSavingRoles(false);
    }
  };

  const loadExamData = async () => {
    try {
      const mySubs = await hrApi.getMySubmissions();
      setMySubmissions(mySubs);
      if (isManagerOrAccountant) {
        const branchSubs = await hrApi.getBranchSubmissions(currentUser?.branchId || undefined);
        setBranchSubmissions(branchSubs);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadUniformData = async () => {
    try {
      const myAllocs = await hrApi.getMyUniformAllocations();
      setMyAllocations(myAllocs);
      if (isManagerOrAccountant) {
        const resigns = await hrApi.getResignationRequests(currentUser?.branchId || undefined);
        setResignationRequests(resigns);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Camera handling (Phase 11: Hardware Permissions & Fallback)
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionModalType('CAMERA');
        setShowPermissionModal(true);
        setMessage({
          text: 'Quyền Máy ảnh bị chặn trên trình duyệt! Vui lòng làm theo hướng dẫn 3 bước để mở lại quyền.',
          type: 'warning'
        });
      } else {
        console.warn('Webcam not accessible, using fallback simulated/file upload', err);
        generateSimulatedSelfie();
      }
    }
  };

  const handleSelfieFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedSelfie(dataUrl);
      setIsCameraActive(false);
      setMessage({ text: 'Đã tải ảnh selfie thành công từ thiết bị!', type: 'success' });
    };
    reader.readAsDataURL(file);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, 400, 400);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedSelfie(dataUrl);
        // Stop stream
        const stream = video.srcObject as MediaStream;
        if (stream) stream.getTracks().forEach(t => t.stop());
        setIsCameraActive(false);
      }
    } else {
      generateSimulatedSelfie();
    }
  };

  const generateSimulatedSelfie = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 300, 300);
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(150, 110, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(150, 240, 80, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Selfie: ${currentUser?.fullName || 'Nhân viên'}`, 150, 260);
      ctx.fillText(new Date().toLocaleTimeString(), 150, 280);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedSelfie(dataUrl);
      setIsCameraActive(false);
    }
  };

  // Location presets
  const setPresetInLocation = () => {
    setCurrentLat(branchCoords.lat);
    setCurrentLon(branchCoords.lon);
    setMessage({ text: 'Đã định vị tại nhà hàng (Khoảng cách: 0m ≤ 50m - HỢP LỆ)', type: 'success' });
  };

  const setPresetOutLocation = () => {
    // 450m away
    setCurrentLat(branchCoords.lat + 0.0041);
    setCurrentLon(branchCoords.lon);
    setMessage({ text: 'Đã chuyển tọa độ cách nhà hàng ~450m > 50m (CẢNH BÁO VI PHẠM GEOFENCE)', type: 'warning' });
  };

  const getRealGPSLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCurrentLat(pos.coords.latitude);
          setCurrentLon(pos.coords.longitude);
          setMessage({ text: 'Đã nhận tọa độ GPS thực từ thiết bị di động', type: 'success' });
        },
        err => {
          if (err.code === err.PERMISSION_DENIED || err.code === 1) {
            setPermissionModalType('GEOLOCATION');
            setShowPermissionModal(true);
            setMessage({
              text: 'Quyền Vị trí GPS bị chặn trên trình duyệt! Vui lòng làm theo hướng dẫn 3 bước để mở lại quyền.',
              type: 'warning'
            });
          } else {
            setMessage({ text: `Không lấy được GPS thực: ${err.message}. Sử dụng nút Demo bên dưới.`, type: 'warning' });
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setMessage({ text: 'Trình duyệt không hỗ trợ định vị GPS.', type: 'error' });
    }
  };

  // Handle Check-In
  const handleCheckIn = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const selfie = capturedSelfie || 'data:image/jpeg;base64,simulated_selfie_image';
      const res = await hrApi.checkIn({
        shiftName,
        selfieUrl: selfie,
        latitude: currentLat,
        longitude: currentLon
      });
      setMessage({
        text: `Check-in thành công! Khoảng cách: ${res.checkInDistanceMeters}m. ${res.isValidLocation ? '✅ Vị trí hợp lệ (≤50m)' : '⚠️ Cảnh báo: Ngoài phạm vi chi nhánh (>50m)!' }`,
        type: res.isValidLocation ? 'success' : 'warning'
      });
      await loadAttendanceData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi khi Check-in', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Check-Out
  const handleCheckOut = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const selfie = capturedSelfie || 'data:image/jpeg;base64,simulated_checkout_selfie';
      const res = await hrApi.checkOut({
        selfieUrl: selfie,
        latitude: currentLat,
        longitude: currentLon
      });
      setMessage({
        text: `Check-out thành công! Tổng giờ làm thực tế: ${res.actualHours} giờ.`,
        type: 'success'
      });
      await loadAttendanceData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi khi Check-out', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Exam handlers
  const startExam = async () => {
    try {
      setLoading(true);
      const qs = await hrApi.getExamQuestions(examPosition);
      setQuestions(qs);
      setAnswers({});
      setExamTimer(900);
      setExamStarted(true);
      setMessage({ text: `Bắt đầu làm bài thi định kỳ vị trí: ${examPosition}. Thời gian: 15 phút.`, type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Lỗi tải đề thi', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmitExam = () => {
    if (examStarted) {
      handleSubmitExam();
    }
  };

  const handleSubmitExam = async () => {
    try {
      setLoading(true);
      const res = await hrApi.submitExam({
        examQuarter: 'Q4-2026',
        answers
      });
      setExamStarted(false);
      setMessage({
        text: `Nộp bài thi thành công! Điểm lý thuyết: ${res.theoryScore}/100. ${res.isPassed ? '🎉 ĐẠT LÝ THUYẾT (>= 70 điểm)' : '❌ CHƯA ĐẠT LÝ THUYẾT (< 70 điểm)'}`,
        type: res.isPassed ? 'success' : 'error'
      });
      await loadExamData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi khi nộp bài thi', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Practical grading handler
  const handleGradePractical = async () => {
    if (!gradingSubmission) return;
    try {
      setLoading(true);
      const res = await hrApi.gradePractical(gradingSubmission.id, {
        practicalScore: practicalScoreInput,
        comment: practicalCommentInput
      });
      setMessage({
        text: `Đã chấm thực hành cho ${res.fullName}! Tổng điểm: ${res.totalScore}/100. Kết quả: ${res.isPassed ? 'ĐẠT' : 'RỚT'}`,
        type: 'success'
      });
      setGradingSubmission(null);
      await loadExamData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi khi chấm thực hành', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Resignation & Uniform Handlers
  const handleSubmitResignation = async () => {
    try {
      setLoading(true);
      const res = await hrApi.submitResignation(resignationReason || 'Xin nghỉ việc vì lý do cá nhân');
      setMessage({
        text: `Đã gửi đơn xin nghỉ việc #${res.id}. Vui lòng bàn giao đủ 100% đồng phục để được giải ngân lương!`,
        type: 'success'
      });
      setResignationReason('');
      await loadUniformData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi gửi đơn nghỉ việc', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleScanAbandonment = async () => {
    try {
      setLoading(true);
      const res = await hrApi.scanAbandonment();
      setAbandonmentResult(res);
      setMessage({
        text: `Đã quét ${res.totalUsersScanned} nhân viên. Phát hiện ${res.suspectedAbandonmentCount} nhân viên vắng mặt 3 ngày liên tiếp.`,
        type: res.suspectedAbandonmentCount > 0 ? 'warning' : 'success'
      });
    } catch (err: any) {
      setMessage({ text: 'Lỗi khi quét nhân viên bỏ việc', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAbandonment = async (userId: number, fullName: string) => {
    if (!window.confirm(`Xác nhận nhân viên [${fullName}] tự ý bỏ việc không thông báo? Hệ thống sẽ khóa tài khoản và thiết lập Lương = 0 đ.`)) {
      return;
    }
    try {
      setLoading(true);
      await hrApi.confirmAbandonment(userId);
      setMessage({
        text: `Đã xác nhận [${fullName}] bỏ việc. Đơn ghi nhận trạng thái BO_VIEC (Không trả lương theo quy chế).`,
        type: 'success'
      });
      await handleScanAbandonment();
      await loadUniformData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi xác nhận bỏ việc', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAbandonment = async (resignationId: number, fullName: string) => {
    if (!window.confirm(`Xác nhận HỦY đánh dấu bỏ việc nhầm cho nhân viên [${fullName}]? Hệ thống sẽ khôi phục trạng thái hoạt động và tính toán lại bảng lương tháng.`)) {
      return;
    }
    try {
      setLoading(true);
      await hrApi.cancelAbandonment(resignationId);
      setMessage({
        text: `Đã hủy bỏ việc nhầm cho nhân viên [${fullName}]. Trạng thái tài khoản đã được kích hoạt lại!`,
        type: 'success'
      });
      await loadUniformData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi khi hủy xác nhận bỏ việc', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openVerifyModal = async (resignation: ResignationRequest) => {
    setVerifyingResignation(resignation);
    setManagerNoteInput(resignation.managerNote || '');
    try {
      const allocs = await hrApi.getUserUniformAllocations(resignation.user.id);
      setEmployeeAllocations(allocs);
      // Pre-check currently returned items
      setSelectedReturnIds(allocs.filter(a => a.isReturned).map(a => a.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmChecklist = async () => {
    if (!verifyingResignation) return;
    try {
      setLoading(true);
      const res = await hrApi.verifyChecklist(verifyingResignation.id, {
        returnedAllocationIds: selectedReturnIds,
        managerNote: managerNoteInput
      });

      if (res.status === 'DANG_GIU_LUONG') {
        setMessage({
          text: `⚠️ Đơn #${res.id} chuyển trạng thái ĐANG GIỮ LƯƠNG: ${res.missingUniformDetails}`,
          type: 'warning'
        });
      } else {
        setMessage({
          text: `✅ Hoàn tất bàn giao 100% đồng phục! Mở khóa thanh toán lương cho ${res.user.fullName}.`,
          type: 'success'
        });
      }
      setVerifyingResignation(null);
      await loadUniformData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi xác nhận checklist', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-emerald-600" />
            Phân Hệ Quản Trị Nhân Sự & Chấm Công Sen Việt
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Chấm công GPS Geofencing selfie, thi lý thuyết/thực hành định kỳ và thu hồi đồng phục giữ lương khi nghỉ việc.
          </p>
        </div>
        <div className="mt-3 md:mt-0 flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Chi nhánh: {branchCoords.name}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            {currentUser?.fullName} ({currentUser?.roles[0]})
          </span>
        </div>
      </div>

      {/* Global Message Banner */}
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

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'attendance'
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Chấm Công GPS & Selfie
        </button>
        <button
          onClick={() => setActiveTab('exam')}
          className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'exam'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          Kỳ Thi Định Kỳ Quý
        </button>
        <button
          onClick={() => setActiveTab('uniform')}
          className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'uniform'
              ? 'border-purple-600 text-purple-600 bg-purple-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shirt className="w-4 h-4" />
          Đồng Phục & Nghỉ Việc
        </button>

        {/* GIAI ĐOẠN 9: PHÂN QUYỀN ĐA VAI TRÒ */}
        {isManagerOrAccountant && (
          <button
            onClick={() => {
              setActiveTab('roles');
              loadUsersData();
            }}
            className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm border-b-2 transition-all ${
              activeTab === 'roles'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Phân Quyền Đa Vai Trò (Phase 9)
          </button>
        )}
      </div>

      {/* TAB 1: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: Camera & Action buttons */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600" />
              Camera Chấm Công & Định Vị
            </h2>

            {/* VÒNG RADAR GPS KHOẢNG CÁCH TRỰC QUAN THỜI GIAN THỰC (Task 13.6) */}
            <div className={`p-4 rounded-2xl border transition-all ${
              distanceMeters <= 50
                ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-300'
                : 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border-rose-300'
            }`}>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Vòng Radar trực quan */}
                <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                  {/* Vòng quét bên ngoài */}
                  <div className={`absolute inset-0 rounded-full border-2 border-dashed ${
                    distanceMeters <= 50 ? 'border-emerald-400' : 'border-rose-400 animate-pulse'
                  }`} />
                  {/* Vòng ranh giới 50m */}
                  <div className={`absolute inset-3 rounded-full border ${
                    distanceMeters <= 50 ? 'border-emerald-500 bg-emerald-500/10' : 'border-rose-500 bg-rose-500/10'
                  }`} />
                  {/* Hiệu ứng xung nhịp radar (Ping) */}
                  <div className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
                    distanceMeters <= 50 ? 'bg-emerald-400' : 'bg-rose-500'
                  }`} />

                  {/* Tâm Nhà hàng */}
                  <div className="relative z-10 p-2 rounded-full bg-white shadow-md flex items-center justify-center">
                    <MapPin className={`h-5 w-5 ${distanceMeters <= 50 ? 'text-emerald-600' : 'text-rose-600'}`} />
                  </div>

                  {/* Chấm vị trí thiết bị */}
                  <div
                    className={`absolute z-20 w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg ${
                      distanceMeters <= 50 ? 'bg-emerald-500 top-4 right-6' : 'bg-rose-600 top-1 right-2 animate-ping'
                    }`}
                  />
                </div>

                {/* Thông số vị trí */}
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                      distanceMeters <= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                    }`}>
                      {distanceMeters <= 50 ? '🟢 GPS HỢP LỆ (≤ 50M)' : '🔴 CẢNH BÁO: NGOÀI PHẠM VI (> 50M)'}
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
                    Khoảng cách: {distanceMeters} mét
                  </div>
                  <p className="text-xs text-slate-500">
                    Chi nhánh: <strong>{branchCoords.name}</strong> (Tọa độ: {currentLat.toFixed(4)}, {currentLon.toFixed(4)})
                  </p>
                </div>
              </div>
            </div>

            {/* GPS Simulation / Control */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
                <span>Tọa độ thiết bị: {currentLat.toFixed(4)}, {currentLon.toFixed(4)}</span>
                <button
                  onClick={getRealGPSLocation}
                  className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                >
                  <RefreshCw className="w-3 h-3" /> Lấy GPS thực
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={setPresetInLocation}
                  className="py-1.5 px-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-medium text-center shadow-sm"
                >
                  📍 Giả lập GPS tại nhà hàng (≤50m)
                </button>
                <button
                  type="button"
                  onClick={setPresetOutLocation}
                  className="py-1.5 px-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-medium text-center shadow-sm"
                >
                  📍 Giả lập GPS ngoài chi nhánh (&gt;50m)
                </button>
              </div>
            </div>

            {/* KHUNG CAMERA SELFIE CÓ ĐƯỜNG DẪN KHUÔN MẶT HÌNH TRÒN (Task 13.6) */}
            <div className="relative aspect-square w-full max-w-[320px] mx-auto bg-slate-950 rounded-3xl overflow-hidden flex flex-col items-center justify-center border-2 border-slate-300 shadow-xl">
              {isCameraActive ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : capturedSelfie ? (
                <img src={capturedSelfie} alt="Selfie" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 text-slate-400 z-10">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-60 text-slate-300" />
                  <p className="text-xs font-bold text-slate-300">Chưa có ảnh selfie</p>
                  <p className="text-[11px] text-slate-400 mt-1">Bấm nút bên dưới để mở camera hoặc tải ảnh</p>
                </div>
              )}

              {/* Đường dẫn khuôn mặt hình tròn / oval hỗ trợ căn góc chuẩn */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-48 h-56 rounded-full border-2 border-dashed border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)] flex flex-col items-center justify-between p-3">
                  <span className="text-[10px] font-bold text-white/90 bg-black/50 px-2 py-0.5 rounded-full mt-1">
                    Trán
                  </span>
                  <span className="text-[10px] font-bold text-white/90 bg-black/50 px-2 py-0.5 rounded-full mb-1">
                    Cằm
                  </span>
                </div>
                <span className="text-[11px] font-black text-white bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full mt-2">
                  Căn khuôn mặt vào khung tròn
                </span>
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Camera Actions */}
            <div className="flex flex-wrap gap-2 justify-center">
              {/* Fallback hidden file input for photo upload */}
              <input
                type="file"
                accept="image/*"
                capture="user"
                ref={selfieFileInputRef}
                onChange={handleSelfieFileSelect}
                className="hidden"
              />
              {!isCameraActive ? (
                <>
                  <button
                    onClick={startCamera}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition-all active:scale-95"
                  >
                    <Camera className="w-4 h-4" /> Mở Camera Chụp
                  </button>
                  <button
                    onClick={() => selfieFileInputRef.current?.click()}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                  >
                    <Upload className="w-4 h-4 text-slate-500" /> Tải Ảnh Lên
                  </button>
                </>
              ) : (
                <button
                  onClick={capturePhoto}
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" /> Chụp Ngay
                </button>
              )}
            </div>

            {/* Shift selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Ca Làm Việc:</label>
              <select
                value={shiftName}
                onChange={e => setShiftName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Ca Sáng (08:00 - 16:00)">Ca Sáng (08:00 - 16:00)</option>
                <option value="Ca Tối (15:00 - 23:00)">Ca Tối (15:00 - 23:00)</option>
                <option value="Ca Gãy (10:00 - 14:00 & 17:00 - 21:00)">Ca Gãy (10:00 - 14:00 & 17:00 - 21:00)</option>
              </select>
            </div>

            {/* 2 Big Action Buttons (min 52px high for mobile) */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="min-h-[52px] py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all"
              >
                <Clock className="w-5 h-5" />
                CHECK-IN
              </button>
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="min-h-[52px] py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                CHECK-OUT
              </button>
            </div>
          </div>

          {/* Right panel: Today attendances & History */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Bảng Chấm Công Hôm Nay ({attendances.length} nhân viên)
              </h2>
              <button
                onClick={loadAttendanceData}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">Nhân viên</th>
                    <th className="py-2.5 px-3">Ca làm</th>
                    <th className="py-2.5 px-3">Giờ vào</th>
                    <th className="py-2.5 px-3">Khoảng cách</th>
                    <th className="py-2.5 px-3">Giờ ra</th>
                    <th className="py-2.5 px-3">Thực tế</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Chưa có bản ghi chấm công nào hôm nay tại chi nhánh.
                      </td>
                    </tr>
                  ) : (
                    attendances.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {a.fullName}
                          <div className="text-[11px] text-slate-400 font-normal">@{a.username}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{a.shiftName}</td>
                        <td className="py-3 px-3 font-mono text-xs">
                          {new Date(a.checkInTime).toLocaleTimeString('vi-VN')}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                              a.isValidLocation ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            <MapPin className="w-3 h-3" />
                            {a.checkInDistanceMeters}m
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs">
                          {a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString('vi-VN') : '—'}
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          {a.actualHours > 0 ? `${a.actualHours} h` : '—'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              a.status === 'HOAN_THANH'
                                ? 'bg-emerald-100 text-emerald-800'
                                : a.status === 'VI_PHAM_KHOANG_CACH'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {a.status === 'HOAN_THANH'
                              ? 'Hoàn thành'
                              : a.status === 'VI_PHAM_KHOANG_CACH'
                              ? 'Lỗi GPS (>100m)'
                              : 'Đang làm việc'}
                          </span>
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

      {/* TAB 2: ONLINE EXAM */}
      {activeTab === 'exam' && (
        <div className="space-y-6">
          {/* Exam Header & Start Action */}
          {!examStarted ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-6 h-6 text-amber-500" />
                  Kỳ Thi Sát Hạch Nghiệp Vụ Định Kỳ (Quý 4/2026)
                </h2>
                <p className="text-sm text-slate-500">
                  Gồm 15 phút thi trắc nghiệm lý thuyết máy chủ tự động chấm + Quản lý đánh giá thực hành (40% Lý thuyết + 60% Thực hành). Điểm sàn đạt chuẩn: ≥ 70/100.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <select
                  value={examPosition}
                  onChange={e => setExamPosition(e.target.value as any)}
                  className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                >
                  <option value="BEP">Khối Bếp / Chế biến</option>
                  <option value="PHUC_VU">Khối Phục Vụ / Bar</option>
                </select>

                <button
                  onClick={startExam}
                  disabled={loading}
                  className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md shadow-blue-600/20 whitespace-nowrap"
                >
                  <FileText className="w-4 h-4" />
                  Bắt Đầu Làm Bài Thi
                </button>
              </div>
            </div>
          ) : (
            /* Taking the Exam View */
            <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-lg space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Đề Thi Lý Thuyết — Vị Trí {examPosition === 'BEP' ? 'BẾP' : 'PHỤC VỤ'}
                  </h3>
                  <div className="text-xs text-slate-500">Số câu: {questions.length} câu trắc nghiệm</div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-mono text-base font-bold shadow-sm">
                  <Clock className="w-5 h-5 animate-pulse" />
                  Thời gian: {formatSeconds(examTimer)}
                </div>
              </div>

              {/* Questions list */}
              <div className="space-y-6">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="font-semibold text-slate-900 text-sm flex items-start gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{q.questionText}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-8">
                      {(['A', 'B', 'C', 'D'] as const).map(opt => {
                        const optText = (q as any)[`option${opt}`];
                        const isSelected = answers[q.id] === opt;
                        return (
                          <label
                            key={opt}
                            className={`p-3 rounded-lg border text-sm cursor-pointer flex items-center gap-2 transition-all ${
                              isSelected
                                ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${q.id}`}
                              value={opt}
                              checked={isSelected}
                              onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span>
                              <strong>{opt}.</strong> {optText}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setExamStarted(false)}
                  className="py-2.5 px-4 text-slate-600 hover:text-slate-800 text-sm font-semibold"
                >
                  Hủy Bài Thi
                </button>
                <button
                  onClick={handleSubmitExam}
                  disabled={loading}
                  className="py-3 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md"
                >
                  NỘP BÀI THI & CHẤM ĐIỂM
                </button>
              </div>
            </div>
          )}

          {/* Submissions Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Submissions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Kết Quả Bài Thi Của Tôi
              </h3>
              <div className="space-y-3">
                {mySubmissions.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">Bạn chưa có bài thi nào trong kỳ này.</p>
                ) : (
                  mySubmissions.map(s => (
                    <div key={s.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm text-slate-900">{s.examQuarter}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            s.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {s.isPassed ? 'ĐẠT CHUẨN' : 'CHƯA ĐẠT'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 text-xs gap-2 py-1 text-slate-600">
                        <div>
                          Lý thuyết: <strong className="text-slate-900">{s.theoryScore} đ</strong>
                        </div>
                        <div>
                          Thực hành: <strong className="text-slate-900">{s.practicalScore ?? 'Chờ chấm'}</strong>
                        </div>
                        <div>
                          Tổng điểm: <strong className="text-blue-600">{s.totalScore} đ</strong>
                        </div>
                      </div>
                      {s.practicalComment && (
                        <div className="text-xs text-slate-500 italic bg-white p-2 rounded border border-slate-200">
                          Nhận xét quản lý: "{s.practicalComment}"
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Manager: Branch submissions for grading */}
            {isManagerOrAccountant && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    Quản Lý: Chấm Điểm Thực Hành Chi Nhánh
                  </h3>
                  <button onClick={loadExamData} className="text-xs text-blue-600 hover:underline">
                    Làm mới
                  </button>
                </div>

                <div className="space-y-3">
                  {branchSubmissions.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">Chưa có bài thi nào nộp tại chi nhánh.</p>
                  ) : (
                    branchSubmissions.map(s => (
                      <div key={s.id} className="p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-sm text-slate-900">{s.fullName}</div>
                          <div className="text-xs text-slate-500">
                            {s.examQuarter} • Lý thuyết: <strong>{s.theoryScore} đ</strong> • Thực hành:{' '}
                            <strong>{s.practicalScore ?? 'Chưa chấm'}</strong>
                          </div>
                          <div className="text-xs text-blue-600 font-semibold mt-0.5">
                            Tổng: {s.totalScore} đ — {s.isPassed ? 'Đạt' : 'Rớt/Chờ'}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setGradingSubmission(s);
                            setPracticalScoreInput(s.practicalScore || 80);
                            setPracticalCommentInput(s.practicalComment || '');
                          }}
                          className="py-1.5 px-3 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-xs font-semibold"
                        >
                          Chấm Thực Hành
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: UNIFORMS & RESIGNATION */}
      {activeTab === 'uniform' && (
        <div className="space-y-6">
          {/* Employee Uniform Allocations Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Shirt className="w-5 h-5 text-purple-600" />
              Đồng Phục & Trang Thiết Bị Đã Được Cấp ({myAllocations.length} món)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {myAllocations.length === 0 ? (
                <div className="col-span-full text-center py-4 text-sm text-slate-400">
                  Bạn chưa có bản ghi cấp phát đồng phục nào.
                </div>
              ) : (
                myAllocations.map(alloc => (
                  <div
                    key={alloc.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                      alloc.isReturned ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-purple-50/50 border-purple-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900">{alloc.uniformItemName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Giá trị cọc: {alloc.depositValue.toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Cấp ngày: {alloc.allocatedDate}</span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          alloc.isReturned ? 'bg-slate-200 text-slate-700' : 'bg-purple-200 text-purple-900'
                        }`}
                      >
                        {alloc.isReturned ? 'Đã trả' : 'Đang giữ'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Employee Resignation Form */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nộp Đơn Xin Nghỉ Việc (Bắt buộc bàn giao 100% đồng phục trước khi thanh toán lương):
                </label>
                <input
                  type="text"
                  placeholder="Lý do nghỉ việc (ví dụ: Chuyển nơi cư trú, lý do gia đình...)"
                  value={resignationReason}
                  onChange={e => setResignationReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <button
                onClick={handleSubmitResignation}
                disabled={loading}
                className="py-2.5 px-6 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold whitespace-nowrap shadow"
              >
                Gửi Đơn Nghỉ Việc
              </button>
            </div>
          </div>

          {/* Manager / Accountant Section: Resignation & Abandonment Verification */}
          {isManagerOrAccountant && (
            <div className="space-y-6">
              {/* Scan Abandonment Card */}
              <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-amber-950 flex items-center gap-2">
                      <UserX className="w-5 h-5 text-amber-600" />
                      Tự Động Quét Nguy Cơ Bỏ Việc (Vắng Mặt 3 Ngày Liên Tiếp)
                    </h3>
                    <p className="text-xs text-amber-800 mt-1">
                      Hệ thống tự động quét nhân viên không chấm công 3 ngày liên tiếp. Nếu Quản lý xác nhận bỏ việc, hệ thống thiết lập Lương = 0 đ theo quy chế.
                    </p>
                  </div>
                  <button
                    onClick={handleScanAbandonment}
                    disabled={loading}
                    className="py-2.5 px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Quét Nguy Cơ Bỏ Việc
                  </button>
                </div>

                {abandonmentResult && abandonmentResult.suspectedUsers.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {abandonmentResult.suspectedUsers.map(u => (
                      <div key={u.userId} className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-sm text-slate-900">{u.fullName} (@{u.username})</div>
                          <div className="text-xs text-rose-600 font-semibold">{u.suggestion}</div>
                        </div>
                        <button
                          onClick={() => handleConfirmAbandonment(u.userId, u.fullName)}
                          className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                        >
                          Xác Nhận Bỏ Việc (Lương = 0)
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resignation Requests List */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                    Danh Sách Đơn Nghỉ Việc & Ràng Buộc Thu Hồi Đồng Phục
                  </h3>
                  <button onClick={loadUniformData} className="text-xs text-blue-600 hover:underline">
                    Làm mới
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                        <th className="py-2.5 px-3">Nhân viên</th>
                        <th className="py-2.5 px-3">Chi nhánh</th>
                        <th className="py-2.5 px-3">Ngày nộp</th>
                        <th className="py-2.5 px-3">Lý do</th>
                        <th className="py-2.5 px-3">Tình trạng đồng phục</th>
                        <th className="py-2.5 px-3">Trạng thái duyệt</th>
                        <th className="py-2.5 px-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {resignationRequests.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Chưa có đơn xin nghỉ việc nào.
                          </td>
                        </tr>
                      ) : (
                        resignationRequests.map(r => (
                          <tr key={r.id} className="hover:bg-slate-50/80">
                            <td className="py-3 px-3 font-semibold text-slate-900">
                              {r.user.fullName}
                              <div className="text-[11px] text-slate-400">@{r.user.username}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-600">{r.branch.branchName}</td>
                            <td className="py-3 px-3 text-xs">{r.requestDate}</td>
                            <td className="py-3 px-3 text-slate-700 max-w-[200px] truncate">{r.reason}</td>
                            {/* Thẻ trạng thái Đồng phục rõ ràng (Task 13.6) */}
                            <td className="py-3 px-3">
                              {r.status === 'HOAN_TAT' ? (
                                <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Đã thu hồi (100%)</span>
                                </span>
                              ) : r.status === 'DANG_GIU_LUONG' || r.missingUniformDetails ? (
                                <span className="inline-flex items-center gap-1 text-xs font-black text-rose-800 bg-rose-100 px-2.5 py-1 rounded-full border border-rose-300 animate-pulse">
                                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                                  <span>Chưa thu hồi: {r.missingUniformDetails || 'Thiếu đồng phục'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                                  <span>Chờ kiểm đếm</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-black ${
                                  r.status === 'HOAN_TAT'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : r.status === 'DANG_GIU_LUONG'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                    : r.status === 'BO_VIEC'
                                    ? 'bg-slate-200 text-slate-800'
                                    : r.status === 'CANCELLED'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {r.status === 'HOAN_TAT'
                                  ? 'ĐƯỢC PHÉP TRẢ LƯƠNG'
                                  : r.status === 'DANG_GIU_LUONG'
                                  ? 'TẠM KHÓA CHI LƯƠNG'
                                  : r.status === 'BO_VIEC'
                                  ? 'Tự ý bỏ việc (Lương = 0)'
                                  : r.status === 'CANCELLED'
                                  ? 'Đã hủy bỏ việc (Khôi phục)'
                                  : 'Chờ duyệt'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex justify-end gap-1.5 items-center">
                                {r.status !== 'BO_VIEC' && r.status !== 'CANCELLED' && (
                                  <button
                                    onClick={() => openVerifyModal(r)}
                                    className="py-1 px-3 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg text-xs font-semibold whitespace-nowrap"
                                  >
                                    Kiểm Đếm Thu Hồi
                                  </button>
                                )}
                                {(r.status === 'BO_VIEC' || r.isAbandoned) && isGeneralAccountant && (
                                  <button
                                    onClick={() => handleCancelAbandonment(r.id, r.user.fullName)}
                                    disabled={loading}
                                    title="Dành cho Kế toán tổng hủy xác nhận nhầm của Quản lý"
                                    className="py-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1 shadow-sm transition-colors"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                                    Hủy xác nhận nhầm
                                  </button>
                                )}
                              </div>
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
        </div>
      )}

      {/* MODAL: Practical Grading */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Chấm Điểm Thực Hành Cho: {gradingSubmission.fullName}
            </h3>

            <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-xs space-y-1 text-blue-900">
              <div>Điểm Lý thuyết máy chủ: <strong>{gradingSubmission.theoryScore} đ</strong> (Tỷ trọng 40%)</div>
              <div>Điểm Thực hành: Tỷ trọng 60%</div>
              <div className="font-bold pt-1 border-t border-blue-200">
                Công thức: Tổng điểm = ({gradingSubmission.theoryScore} × 0.4) + (Điểm TH × 0.6) ≥ 70 đ là ĐẠT
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Điểm Thực Hành (0 - 100):
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={practicalScoreInput}
                onChange={e => setPracticalScoreInput(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nhận xét của Quản lý:
              </label>
              <textarea
                rows={3}
                value={practicalCommentInput}
                onChange={e => setPracticalCommentInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setGradingSubmission(null)}
                className="py-2 px-4 text-slate-600 hover:text-slate-800 text-sm font-semibold"
              >
                Đóng
              </button>
              <button
                onClick={handleGradePractical}
                disabled={loading}
                className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow"
              >
                Lưu Điểm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Verify Uniform Return Checklist */}
      {verifyingResignation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Shirt className="w-5 h-5 text-purple-600" />
              Checklist Thu Hồi Đồng Phục: {verifyingResignation.user.fullName}
            </h3>

            <p className="text-xs text-slate-500">
              Đánh dấu các món đã nhận lại. Nếu thiếu dù chỉ 01 món, hệ thống sẽ tự động khóa thanh toán và chuyển trạng thái <strong>ĐANG GIỮ LƯƠNG</strong>.
            </p>

            {/* Checklist items */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {employeeAllocations.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Không tìm thấy đồng phục nào đã cấp.</p>
              ) : (
                employeeAllocations.map(alloc => {
                  const isChecked = selectedReturnIds.includes(alloc.id);
                  return (
                    <label
                      key={alloc.id}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedReturnIds(prev => [...prev, alloc.id]);
                            } else {
                              setSelectedReturnIds(prev => prev.filter(id => id !== alloc.id));
                            }
                          }}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <div>
                          <div className="font-bold text-sm text-slate-900">{alloc.uniformItemName}</div>
                          <div className="text-xs text-slate-500">Cấp ngày: {alloc.allocatedDate}</div>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        isChecked ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                      }`}>
                        {isChecked ? 'ĐÃ THU HỒI' : 'CHƯA TRẢ'}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú của Quản lý:</label>
              <input
                type="text"
                placeholder="Ghi chú thêm (ví dụ: hẹn trả áo sau, v.v.)"
                value={managerNoteInput}
                onChange={e => setManagerNoteInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setVerifyingResignation(null)}
                className="py-2 px-4 text-slate-600 hover:text-slate-800 text-sm font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmChecklist}
                disabled={loading}
                className="py-2.5 px-6 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-sm font-bold shadow"
              >
                Xác Nhận Checklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: PHÂN QUYỀN ĐA VAI TRÒ (MULTI-ROLE RBAC)                 */}
      {/* ============================================================== */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-indigo-950">
              <strong className="font-bold">Kiến Trúc Phân Quyền Đa Vai Trò (Multi-Role RBAC):</strong>
              <p className="mt-0.5 text-indigo-900/90 leading-relaxed">
                Cho phép 01 nhân sự sở hữu đồng thời nhiều vai trò. Ví dụ: Nhân viên Bếp vừa thao tác 4 nút kho bếp
                (ROLE_KITCHEN_STAFF), vừa là Nhân viên cá nhân (ROLE_EMPLOYEE) để tự chấm công selfie, làm bài thi định kỳ quý
                và xem phiếu lương. Kế toán tổng có thể linh hoạt gán thêm vai trò cho nhân sự.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>Danh Sách Người Dùng & Vai Trò Hệ Thống ({allUsers.length || 5})</span>
              </h3>
              <button
                onClick={loadUsersData}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Làm mới</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Họ Và Tên</th>
                    <th className="p-3.5">Tên Đăng Nhập</th>
                    <th className="p-3.5">Chi Nhánh</th>
                    <th className="p-3.5">Các Vai Trò Đang Sở Hữu</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(allUsers.length > 0
                    ? allUsers
                    : [
                        {
                          id: 1,
                          fullName: 'Nguyễn Văn Bếp (Thái Nguyên)',
                          username: 'bep_thainguyen',
                          branchName: 'Chi nhánh Thái Nguyên',
                          roles: ['ROLE_KITCHEN_STAFF', 'ROLE_EMPLOYEE'] as RoleName[],
                          status: 'ACTIVE',
                        },
                        {
                          id: 2,
                          fullName: 'Trần Thị Bếp (Quế Võ)',
                          username: 'bep_quevo',
                          branchName: 'Chi nhánh Quế Võ',
                          roles: ['ROLE_KITCHEN_STAFF', 'ROLE_EMPLOYEE'] as RoleName[],
                          status: 'ACTIVE',
                        },
                        {
                          id: 3,
                          fullName: 'Lê Quản Lý (Thái Nguyên)',
                          username: 'ql_thainguyen',
                          branchName: 'Chi nhánh Thái Nguyên',
                          roles: ['ROLE_RESTAURANT_MANAGER', 'ROLE_EMPLOYEE'] as RoleName[],
                          status: 'ACTIVE',
                        },
                        {
                          id: 4,
                          fullName: 'Phạm Kế Toán (Thái Nguyên)',
                          username: 'ketoan_thainguyen',
                          branchName: 'Chi nhánh Thái Nguyên',
                          roles: ['ROLE_BRANCH_ACCOUNTANT', 'ROLE_EMPLOYEE'] as RoleName[],
                          status: 'ACTIVE',
                        },
                        {
                          id: 5,
                          fullName: 'Hoàng Kế Toán Tổng (Admin)',
                          username: 'ketoantong_admin',
                          branchName: 'Hội sở chính',
                          roles: ['ROLE_GENERAL_ACCOUNTANT', 'ROLE_EMPLOYEE'] as RoleName[],
                          status: 'ACTIVE',
                        },
                      ]
                  ).map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{u.fullName}</td>
                      <td className="p-3.5 font-mono text-indigo-700 font-semibold">{u.username}</td>
                      <td className="p-3.5 text-slate-600">{u.branchName || 'Toàn chuỗi'}</td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {(u.roles || []).map((r: string) => (
                            <span
                              key={r}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                r === 'ROLE_KITCHEN_STAFF'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : r === 'ROLE_EMPLOYEE'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                  : r === 'ROLE_RESTAURANT_MANAGER'
                                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                  : r === 'ROLE_BRANCH_ACCOUNTANT'
                                  ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                  : 'bg-rose-100 text-rose-900 border border-rose-200'
                              }`}
                            >
                              {r.replace('ROLE_', '')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleOpenEditRoles(u)}
                          className="btn-touch px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors"
                        >
                          Gán / Sửa vai trò
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: GÁN / CHỈNH SỬA VAI TRÒ NGƯỜI DÙNG                     */}
      {/* ============================================================== */}
      {editingRolesUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-700 font-black text-base">
                <ShieldCheck className="h-6 w-6" />
                <span>GÁN VAI TRÒ CHO: {editingRolesUser.fullName}</span>
              </div>
              <button
                onClick={() => setEditingRolesUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                <div>
                  <span className="text-slate-400">Tài khoản: </span>
                  <strong className="text-slate-900 font-mono">{editingRolesUser.username}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Chi nhánh: </span>
                  <strong className="text-slate-900">{editingRolesUser.branchName || 'Toàn hệ thống'}</strong>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Chọn các vai trò áp dụng (Multi-Role):
                </label>

                {[
                  {
                    id: 'ROLE_KITCHEN_STAFF',
                    label: 'ROLE_KITCHEN_STAFF (Bếp & Bar)',
                    desc: 'Thực hiện 4 nút: Lấy hàng, Mở mẻ & Cân hụt, Ra line (+1), Báo hỏng.',
                  },
                  {
                    id: 'ROLE_EMPLOYEE',
                    label: 'ROLE_EMPLOYEE (Nhân Viên Cá Nhân)',
                    desc: 'Chấm công GPS & selfie, tham gia kỳ thi định kỳ quý, xem phiếu lương & ứng lương.',
                  },
                  {
                    id: 'ROLE_RESTAURANT_MANAGER',
                    label: 'ROLE_RESTAURANT_MANAGER (Quản Lý Chi Nhánh)',
                    desc: 'Duyệt đơn báo hỏng mẻ, kiểm tra đối soát cuối ngày, chấm thi thực hành, thu hồi đồng phục.',
                  },
                  {
                    id: 'ROLE_BRANCH_ACCOUNTANT',
                    label: 'ROLE_BRANCH_ACCOUNTANT (Kế Toán Chi Nhánh)',
                    desc: 'Upload file doanh thu CukCuk, kiểm tra xuất nhập tồn, lập lệnh chi lương chi nhánh.',
                  },
                  {
                    id: 'ROLE_GENERAL_ACCOUNTANT',
                    label: 'ROLE_GENERAL_ACCOUNTANT (Kế Toán Tổng / Admin)',
                    desc: 'Toàn quyền 2 chi nhánh, phân quyền tài khoản, xuất báo cáo đối soát và file chuyển khoản ngân hàng.',
                  },
                ].map((roleItem) => {
                  const isChecked = selectedUserRoles.includes(roleItem.id);
                  return (
                    <label
                      key={roleItem.id}
                      onClick={() => handleToggleRole(roleItem.id)}
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-50/70 border-indigo-300 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-slate-900">{roleItem.label}</div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">{roleItem.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRolesUser(null)}
                  className="btn-touch h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  HỦY BỎ
                </button>
                <button
                  type="button"
                  onClick={handleSaveUserRoles}
                  disabled={isSavingRoles}
                  className="btn-touch h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  {isSavingRoles ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>LƯU PHÂN QUYỀN</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hardware Permission Guide Modal (Phase 11: Hardware Permissions UX) */}
      <PermissionGuideModal
        isOpen={showPermissionModal}
        type={permissionModalType}
        onClose={() => setShowPermissionModal(false)}
        onRetry={() => {
          setShowPermissionModal(false);
          if (permissionModalType === 'CAMERA') {
            startCamera();
          } else {
            getRealGPSLocation();
          }
        }}
      />
    </div>
  );
};
export default HRModule;
