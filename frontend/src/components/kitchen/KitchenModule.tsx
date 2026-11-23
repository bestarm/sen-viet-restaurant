import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Flame,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Camera,
  RotateCw,
  Scale,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Salad,
  Plus,
  Trash2,
  ShieldAlert,
  Image as ImageIcon,
  Search,
  Check,
  Clock,
  ZoomIn,
  Undo2,
  History,
  XCircle,
  FileText,
  Utensils,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  kitchenApi,
  Item,
  Recipe,
  BatchResponse,
  DailyRemainingItem,
  ConfirmDailyWasteRequest,
  QuickAddLineItemRequest,
  TakeOutLog,
  DamageReport,
  ProcessedDish,
  PreProcessingCategory,
} from '../../api/kitchen';
import {
  warehouseApi,
  ImportBatch,
  Supplier,
  WAREHOUSE_LOCATIONS,
} from '../../api/warehouse';
import {
  PRE_PROCESSING_CATEGORIES,
  getItemPreProcessingCategory,
} from '../../types/warehouse';
import { compressImage, CompressionResult } from '../../utils/imageCompressor';

export type KitchenStation = 'ALL' | 'BEP_NONG' | 'BEP_LANH' | 'BAR' | 'RA_LINE';

interface VirtualNumpadProps {
  value: number;
  onChange: (val: number) => void;
  unit?: string;
  quickAddValues?: number[];
  max?: number;
  className?: string;
}

/**
 * Numpad ảo kích thước lớn cho màn hình cảm ứng Kiosk / Tablet bếp.
 * Phím số to rõ, hỗ trợ găng tay làm việc và các nút cộng dồn định lượng nhanh.
 * Hỗ trợ dấu chấm '.' thập phân và gõ trực tiếp bàn phím cứng / cảm ứng.
 * Trên màn hình Desktop PC (lg:), cụm 3x4 Numpad ảo được ẩn qua class lg:hidden để tối ưu không gian.
 */
const VirtualNumpad: React.FC<VirtualNumpadProps> = ({
  value,
  onChange,
  unit = 'kg',
  quickAddValues = [1, 5, 10],
  max,
  className = '',
}) => {
  const [strVal, setStrVal] = useState<string>(value > 0 ? value.toString() : '');

  useEffect(() => {
    // Chỉ đồng bộ lại khi giá trị số khác biệt thực sự
    // Tránh xóa mất dấu chấm dở dang "0." hoặc "5." khi gõ
    const curNum = parseFloat(strVal);
    if ((isNaN(curNum) && value > 0) || (!isNaN(curNum) && curNum !== value)) {
      setStrVal(value > 0 ? value.toString() : '');
    }
  }, [value]);

  const handleDigit = (digit: string) => {
    let next: string;
    if (!strVal || strVal === '0') {
      next = digit === '.' ? '0.' : digit;
    } else if (digit === '.' && strVal.includes('.')) {
      return;
    } else {
      next = strVal + digit;
    }
    setStrVal(next);
    const num = parseFloat(next);
    if (!isNaN(num)) {
      if (max !== undefined && num > max) return;
      onChange(num);
    } else {
      onChange(0);
    }
  };

  const handleClear = () => {
    setStrVal('');
    onChange(0);
  };

  const handleBackspace = () => {
    const next = strVal.length > 1 ? strVal.slice(0, -1) : '';
    setStrVal(next);
    onChange(parseFloat(next) || 0);
  };

  const handleQuickAdd = (add: number) => {
    const cur = parseFloat(strVal) || 0;
    const nextNum = Math.round((cur + add) * 10) / 10;
    if (max !== undefined && nextNum > max) {
      onChange(max);
      setStrVal(max.toString());
    } else {
      onChange(nextNum);
      setStrVal(nextNum.toString());
    }
  };

  return (
    <div className={`bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 space-y-2.5 ${className}`}>
      {/* Ô nhập trực tiếp hỗ trợ bàn phím cứng & chuyển đổi dấu phẩy ',' thành '.' */}
      <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-slate-200">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Số đang nhập:</span>
        <div className="flex items-baseline gap-1">
          <input
            type="text"
            inputMode="decimal"
            value={strVal}
            onChange={(e) => {
              const raw = e.target.value.replace(',', '.');
              if (raw === '' || /^[0-9]*\.?[0-9]*$/.test(raw)) {
                setStrVal(raw);
                const num = parseFloat(raw);
                if (!isNaN(num)) {
                  if (max !== undefined && num > max) return;
                  onChange(num);
                } else {
                  onChange(0);
                }
              }
            }}
            placeholder="0"
            className="w-32 text-right font-mono font-black text-2xl text-slate-900 bg-transparent focus:outline-none focus:border-b-2 focus:border-emerald-500"
          />
          <span className="font-extrabold text-slate-600 text-sm">{unit}</span>
        </div>
      </div>

      {/* Phím tắt định lượng nhanh */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Cộng nhanh:</span>
        {quickAddValues.map((add) => (
          <button
            key={add}
            type="button"
            onClick={() => handleQuickAdd(add)}
            className="btn-touch px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 font-extrabold text-xs text-slate-800 shadow-sm active:scale-95 transition-transform"
          >
            +{add} {unit}
          </button>
        ))}
      </div>

      {/* Numpad 3x4 Grid lớn + Nút dấu chấm '.' và Xóa (TASK-PC-07: Ẩn trên Desktop PC qua lg:hidden) */}
      <div className="grid grid-cols-3 gap-2 lg:hidden">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="btn-touch h-12 sm:h-14 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 font-black text-xl text-slate-900 shadow-sm active:scale-95 transition-transform"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleDigit('.')}
          className="btn-touch h-12 sm:h-14 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 font-black text-2xl text-slate-900 shadow-sm active:scale-95"
        >
          .
        </button>
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="btn-touch h-12 sm:h-14 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 font-black text-xl text-slate-900 shadow-sm active:scale-95"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="btn-touch h-12 sm:h-14 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 font-black text-xs text-slate-700 shadow-sm active:scale-95"
        >
          ⌫ Xóa
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="col-span-3 btn-touch h-10 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold text-xs text-rose-700 shadow-sm active:scale-95 flex items-center justify-center gap-1"
        >
          <span>✕</span> XÓA TẤT CẢ (C)
        </button>
      </div>
    </div>
  );
};

export const KitchenModule: React.FC = () => {
  const { user } = useAuth();
  const { showError, showSuccess, showWarning } = useNotification();

  // Dữ liệu danh mục
  const [items, setItems] = useState<Item[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeBatches, setActiveBatches] = useState<BatchResponse[]>([]);
  const [processedDishes, setProcessedDishes] = useState<ProcessedDish[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Trạng thái mở các Modals (Chuẩn hóa 5 Nút Bếp)
  const [activeModal, setActiveModal] = useState<'takeOut' | 'batch' | 'lineItem' | 'damage' | 'leftoverWaste' | null>(null);

  // --- Nút 1: Lấy hàng state (Kho Trước Chế Biến 11 nhóm & Đa dạng ĐVT) ---
  const [selectedPreCategory, setSelectedPreCategory] = useState<PreProcessingCategory | 'ALL'>('ALL');
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [takeOutQty, setTakeOutQty] = useState<number | ''>('');
  const [takeOutUnit, setTakeOutUnit] = useState<string>('kg');
  const [takeOutNote, setTakeOutNote] = useState<string>('');
  const [isTakingOut, setIsTakingOut] = useState<boolean>(false);
  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [isLoadingStock, setIsLoadingStock] = useState<boolean>(false);
  // TASK-S1-03: Lịch sử lấy hàng trong ca & Hủy lấy hàng
  const [takeOutLogs, setTakeOutLogs] = useState<TakeOutLog[]>([]);
  const [cancellingTakeOutId, setCancellingTakeOutId] = useState<number | null>(null);

  // --- Nút 5: Tạo Đồ Ăn Thừa Cuối Ca state (Bắt buộc có ảnh) ---
  const [leftoverDishId, setLeftoverDishId] = useState<number | ''>('');
  const [leftoverItemName, setLeftoverItemName] = useState<string>('');
  const [leftoverQty, setLeftoverQty] = useState<number | ''>('');
  const [leftoverUnit, setLeftoverUnit] = useState<string>('đĩa');
  const [leftoverLocation, setLeftoverLocation] = useState<'LINE' | 'BEP'>('LINE');
  const [leftoverReason, setLeftoverReason] = useState<string>('Khách dùng không hết');
  const [leftoverShift, setLeftoverShift] = useState<'CA_TOI' | 'CA_SANG'>('CA_TOI');
  const [leftoverNote, setLeftoverNote] = useState<string>('');
  const [leftoverPhoto, setLeftoverPhoto] = useState<CompressionResult | null>(null);
  const [isCompressingLeftoverPhoto, setIsCompressingLeftoverPhoto] = useState<boolean>(false);
  const [isSubmittingLeftover, setIsSubmittingLeftover] = useState<boolean>(false);
  const leftoverPhotoInputRef = useRef<HTMLInputElement>(null);

  // TASK-LOGIC-01: Lấy tồn kho khả dụng tức thời của món được chọn
  const fetchAvailableStock = async (itemId: number) => {
    if (!itemId) return;
    try {
      setIsLoadingStock(true);
      const branchId =
        user?.branchId ||
        (localStorage.getItem('senviet_current_branch')?.includes('Quế Võ') ? 2 : 1);
      const stock = await kitchenApi.getItemAvailableStock(itemId, branchId);
      setAvailableStock(stock);
    } catch (err) {
      console.error('Lỗi khi lấy tồn kho khả dụng:', err);
      setAvailableStock(0);
    } finally {
      setIsLoadingStock(false);
    }
  };

  useEffect(() => {
    if (activeModal === 'takeOut' && selectedItemId) {
      fetchAvailableStock(Number(selectedItemId));
    }
  }, [activeModal, selectedItemId]);

  // --- Nút 2: Chế biến mẻ state ---
  const [batchTab, setBatchTab] = useState<'start' | 'finish'>('start');
  const [batchItemId, setBatchItemId] = useState<number | ''>('');
  const [batchInputWeight, setBatchInputWeight] = useState<number>(0);
  const [batchNote, setBatchNote] = useState<string>('');
  const [isStartingBatch, setIsStartingBatch] = useState<boolean>(false);
  // Cảnh báo mẻ thứ hai modal
  const [showSecondBatchWarning, setShowSecondBatchWarning] = useState<boolean>(false);
  const [pendingBatchRequest, setPendingBatchRequest] = useState<{ itemId: number; inputWeight: number; unit: string; note?: string } | null>(null);
  // Cân thành phẩm state
  const [selectedFinishBatch, setSelectedFinishBatch] = useState<BatchResponse | null>(null);
  const [finishOutputWeight, setFinishOutputWeight] = useState<number>(0);
  const [isFinishingBatch, setIsFinishingBatch] = useState<boolean>(false);
  // TASK-WH-04: Bắt buộc ảnh mặt bàn cân điện tử chống gian lận
  const [finishScalePhoto, setFinishScalePhoto] = useState<string | null>(null);
  const [isCompressingScalePhoto, setIsCompressingScalePhoto] = useState<boolean>(false);
  const [previewScalePhoto, setPreviewScalePhoto] = useState<string | null>(null);
  const finishScalePhotoInputRef = useRef<HTMLInputElement>(null);

  // --- GIAI ĐOẠN 8: Chặn cứng mẻ có báo hỏng chưa duyệt (HTTP 422) ---
  const [showUnapprovedDamageModal, setShowUnapprovedDamageModal] = useState<boolean>(false);
  const [unapprovedDamageError, setUnapprovedDamageError] = useState<string>('');

  // --- GIAI ĐOẠN 8: Món chỉ dùng trong ngày cuối ca ---
  const [showDailyWasteModal, setShowDailyWasteModal] = useState<boolean>(false);
  const [dailyItems, setDailyItems] = useState<DailyRemainingItem[]>([]);
  const [dailyWasteShift, setDailyWasteShift] = useState<'CA_TOI' | 'CA_SANG'>('CA_TOI');
  const [dailyWasteDate, setDailyWasteDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailyWasteQuantities, setDailyWasteQuantities] = useState<{ [itemId: number]: number }>({});
  const [dailyWasteItemNotes, setDailyWasteItemNotes] = useState<{ [itemId: number]: string }>({});
  const [dailyWasteGeneralNote, setDailyWasteGeneralNote] = useState<string>('');
  const [isLoadingDailyItems, setIsLoadingDailyItems] = useState<boolean>(false);
  const [isSubmittingDailyWaste, setIsSubmittingDailyWaste] = useState<boolean>(false);

  // --- GIAI ĐOẠN 8: Thêm món nhanh ra line ---
  const [showQuickAddModal, setShowQuickAddModal] = useState<boolean>(false);
  const [quickItemName, setQuickItemName] = useState<string>('');
  const [quickItemCategory, setQuickItemCategory] = useState<string>('MÓN NẤU / RA LINE');
  const [quickItemUnit, setQuickItemUnit] = useState<string>('Đĩa');
  const [quickItemCostPrice, setQuickItemCostPrice] = useState<number>(50000);
  const [quickIsDailyOnly, setQuickIsDailyOnly] = useState<boolean>(false);
  const [isSubmittingQuickAdd, setIsSubmittingQuickAdd] = useState<boolean>(false);

  // --- Nút 3: Ra line (+1) state & idempotency ---
  const [lineCounters, setLineCounters] = useState<{ [itemId: number]: number }>({});
  const [loadingLineButtons, setLoadingLineButtons] = useState<{ [itemId: number]: boolean }>({});
  const [cooldownButtons, setCooldownButtons] = useState<{ [itemId: number]: boolean }>({});
  const [animatingLineItemId, setAnimatingLineItemId] = useState<number | null>(null);
  const [shakingLineItemId, setShakingLineItemId] = useState<number | null>(null);
  const [selectedStation, setSelectedStation] = useState<KitchenStation>('ALL');
  const [lineSearchTerm, setLineSearchTerm] = useState<string>('');

  // Bộ lọc Station theo từng trạm chế biến bếp
  const filterItemsByStation = (itemList: Item[], station: KitchenStation) => {
    if (station === 'ALL') return itemList;
    if (station === 'BAR') {
      return itemList.filter(
        (it) => it.category?.toLowerCase().includes('bar') || it.category?.toLowerCase().includes('đồ uống')
      );
    }
    if (station === 'BEP_LANH') {
      return itemList.filter(
        (it) =>
          it.category?.toLowerCase().includes('salad') ||
          it.category?.toLowerCase().includes('khai vị') ||
          it.category?.toLowerCase().includes('nộm') ||
          it.category?.toLowerCase().includes('kim chi') ||
          it.category?.toLowerCase().includes('tráng miệng') ||
          it.isDailyOnly
      );
    }
    if (station === 'BEP_NONG') {
      return itemList.filter(
        (it) =>
          it.category?.toLowerCase().includes('thịt') ||
          it.category?.toLowerCase().includes('hải sản') ||
          it.category?.toLowerCase().includes('nấu') ||
          it.category?.toLowerCase().includes('nướng')
      );
    }
    if (station === 'RA_LINE') {
      return itemList.filter((it) => it.isBuffetLine);
    }
    return itemList;
  };

  // --- Nút 4: Báo hỏng state ---
  const [damageItemId, setDamageItemId] = useState<number | ''>('');
  const [damageQty, setDamageQty] = useState<number>(1);
  const [damageReason, setDamageReason] = useState<string>('HONG_DO_NHA_CUNG_CAP');
  const [damageSupplier, setDamageSupplier] = useState<string>('NCC_HAI_SAN_01');
  const [availableBatches, setAvailableBatches] = useState<ImportBatch[]>([]);
  const [selectedBatchCode, setSelectedBatchCode] = useState<string>('');
  const [damageNote, setDamageNote] = useState<string>('');
  const [damageImage, setDamageImage] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isSubmittingDamage, setIsSubmittingDamage] = useState<boolean>(false);
  // TASK-S1-05: Đơn báo hỏng đã gửi ca này
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [viewingDamageImage, setViewingDamageImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // --- KHO-13: Cân hàng mới về (Bếp nhận hàng NCC) state ---
  const [showReceiveModal, setShowReceiveModal] = useState<boolean>(false);
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [receiveSupplierId, setReceiveSupplierId] = useState<number | undefined>(undefined);
  const [receiveItemId, setReceiveItemId] = useState<number | undefined>(undefined);
  const [receiveWeight, setReceiveWeight] = useState<string>('');
  const [receiveLocation, setReceiveLocation] = useState<string>('KHO_BE_SONG');
  const [receiveNote, setReceiveNote] = useState<string>('');
  const [receivePhoto, setReceivePhoto] = useState<CompressionResult | null>(null);
  const [isSubmittingReceive, setIsSubmittingReceive] = useState<boolean>(false);
  const receivePhotoInputRef = useRef<HTMLInputElement>(null);

  const handleReceivePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await compressImage(file, 1280, 720, 0.75, {
        branchName:
          user?.branchName || (user?.branchId === 2 ? 'Sen Việt - Quế Võ' : 'Sen Việt - Thái Nguyên'),
        userName: user?.fullName || 'Bếp viên',
        docType: 'Cân nhận hàng NCC',
        docTypeName: 'Cân nhận hàng NCC',
      });
      setReceivePhoto(res);
      showNotice('success', 'Đã chụp & nén ảnh bàn cân kèm Watermark thành công');
    } catch (err) {
      console.error('Lỗi khi nén ảnh bàn cân:', err);
      showNotice('error', 'Lỗi khi chụp ảnh');
    } finally {
      if (receivePhotoInputRef.current) receivePhotoInputRef.current.value = '';
    }
  };

  const handleSubmitReceiveWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveSupplierId) {
      showNotice('error', 'Vui lòng chọn Nhà cung cấp giao hàng');
      return;
    }
    if (!receiveItemId) {
      showNotice('error', 'Vui lòng chọn Mặt hàng nhận');
      return;
    }
    const w = parseFloat(receiveWeight.replace(',', '.'));
    if (isNaN(w) || w <= 0) {
      showNotice('error', 'Vui lòng nhập số cân thực tế hợp lệ (> 0)');
      return;
    }
    if (!receivePhoto) {
      showNotice('error', '⚠️ Vui lòng chụp ảnh bàn cân hoặc phiếu giao hàng trước khi lưu!');
      return;
    }

    try {
      setIsSubmittingReceive(true);
      const selItem = items.find((i) => i.id === receiveItemId);
      const selSup = suppliersList.find((s) => s.id === receiveSupplierId);

      await warehouseApi.createDocument({
        branchId: user?.branchId || 1,
        branchCode: (user?.branchId === 2 ? 'QV' : 'TN') as any,
        docType: 'NHAP',
        supplierId: receiveSupplierId,
        warehouseLocation: receiveLocation,
        note: `Bếp nhận & cân thực tế: ${receiveNote || 'Giao nhận tại cửa bếp ca hôm nay'}`,
        imageUrls: receivePhoto.dataUrl,
        items: [
          {
            itemId: receiveItemId,
            quantity: w,
            actualWeight: w,
            supplierReportedWeight: w,
            unitPrice: 0, // Tuyệt đối ẩn giá với Bếp
            warehouseLocation: receiveLocation,
          },
        ],
      });

      showNotice(
        'success',
        `✅ Bếp đã cân ${w} kg ${selItem?.itemName || 'hàng'} từ ${selSup?.supplierName || 'NCC'}. Phiếu đã chuyển về màn hình Kế toán chi nhánh!`
      );
      setShowReceiveModal(false);
      setReceiveWeight('');
      setReceiveNote('');
      setReceivePhoto(null);
    } catch (err: any) {
      console.error('Lỗi lưu phiếu cân bếp:', err);
      showNotice('error', 'Lỗi khi lưu phiếu cân: ' + (err.message || 'Lỗi hệ thống'));
    } finally {
      setIsSubmittingReceive(false);
    }
  };

  // Tải dữ liệu ban đầu
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const currentBranchId =
        user?.branchId ||
        (localStorage.getItem('senviet_current_branch')?.includes('Quế Võ') ? 2 : 1);

      const [itemList, recipeList, batchList, takeOutList, damageList, suppliers, dishesList] =
        await Promise.all([
          kitchenApi.getBuffetItems(),
          kitchenApi.getRecipes(),
          kitchenApi.getActiveBatches(),
          kitchenApi.getTakeOutLogs(),
          kitchenApi.getDamageReports(),
          warehouseApi.getSuppliers(),
          warehouseApi.getProcessedDishes({ branchId: currentBranchId }),
        ]);
      setItems(itemList);
      setRecipes(recipeList);
      setActiveBatches(batchList);
      setTakeOutLogs(takeOutList);
      setDamageReports(damageList);
      setSuppliersList(suppliers);
      setProcessedDishes(dishesList);

      if (dishesList.length > 0 && !leftoverDishId) {
        setLeftoverDishId(dishesList[0].id);
        setLeftoverItemName(dishesList[0].dishName);
        setLeftoverUnit(dishesList[0].unit || 'đĩa');
      }

      if (suppliers.length > 0 && !receiveSupplierId) {
        setReceiveSupplierId(suppliers[0].id);
      }
      if (itemList.length > 0 && !selectedItemId) {
        setSelectedItemId(itemList[0].id);
        setTakeOutUnit(itemList[0].unit || 'kg');
        setBatchItemId(itemList[0].id);
        setDamageItemId(itemList[0].id);
        setReceiveItemId(itemList[0].id);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu bếp:', err);
      showNotice('error', 'Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Khi chọn mặt hàng báo hỏng, nạp danh sách các lô nhập (lots) còn tồn của mặt hàng đó
  useEffect(() => {
    if (damageItemId) {
      warehouseApi.getAvailableBatches({ itemId: Number(damageItemId) })
        .then((batches) => {
          setAvailableBatches(batches);
          if (batches.length > 0) {
            setSelectedBatchCode(batches[0].batchCode);
            if (batches[0].supplierCode || batches[0].supplierName) {
              setDamageSupplier(batches[0].supplierCode || batches[0].supplierName || '');
            }
          } else {
            setSelectedBatchCode('');
          }
        })
        .catch(() => {
          setAvailableBatches([]);
          setSelectedBatchCode('');
        });
    }
  }, [damageItemId]);

  // TASK-PC-07: Hệ thống phím tắt PC công thái học (Escape đóng modal, F2 hoặc / focus tìm kiếm, Ctrl+S lưu nhanh)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Phím Escape: Đóng mọi modal đang mở ngay lập tức
      if (e.key === 'Escape') {
        if (activeModal) setActiveModal(null);
        if (showReceiveModal) setShowReceiveModal(false);
        if (showDailyWasteModal) setShowDailyWasteModal(false);
        if (viewingDamageImage) setViewingDamageImage(null);
        if (showQuickAddModal) setShowQuickAddModal(false);
        if (previewScalePhoto) setPreviewScalePhoto(null);
        return;
      }

      // 2. Phím F2 hoặc '/': Nhảy con trỏ (focus) vào ô tìm kiếm hàng hóa
      const target = e.target as HTMLElement;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (e.key === 'F2' || (e.key === '/' && !isTyping)) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Tìm"], input[placeholder*="tìm"]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // 3. Phím Ctrl+S hoặc Cmd+S: Lưu nhanh form đang mở
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const activeSubmitBtn = document.querySelector<HTMLButtonElement>(
          '.fixed form button[type="submit"], .fixed button.btn-touch-submit'
        );
        if (activeSubmitBtn && !activeSubmitBtn.disabled) {
          activeSubmitBtn.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeModal,
    showReceiveModal,
    showDailyWasteModal,
    viewingDamageImage,
    showQuickAddModal,
    previewScalePhoto,
  ]);

  const showNotice = (type: 'success' | 'error' | 'warning', text: string) => {
    setStatusMessage({ type: type === 'warning' ? 'error' : type, text });
    setTimeout(() => setStatusMessage(null), 4500);

    // Bắn alert nổi bật (Task 12.2: Prominent Visual Alerts)
    if (type === 'error') {
      showError(text, 'LỖI THAO TÁC BẾP');
    } else if (type === 'warning') {
      showWarning(text, 'CẢNH BÁO MẺ BẾP');
    } else {
      showSuccess(text, 'THAO TÁC BẾP THÀNH CÔNG');
    }
  };

  // -------------------------------------------------------------
  // Xử lý Nút 1: LẤY HÀNG (TASK-LOGIC-01: Chặn vượt tồn & Khấu trừ tức thời)
  // -------------------------------------------------------------
  const handleTakeOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = typeof takeOutQty === 'string' ? parseFloat(takeOutQty) : takeOutQty;
    if (!selectedItemId || !takeOutQty || isNaN(qty) || qty <= 0) {
      showNotice('error', 'Vui lòng nhập số lượng xuất hợp lệ (> 0)');
      return;
    }

    const item = items.find((i) => i.id === Number(selectedItemId));
    if (!item) return;

    // Chặn cứng nếu số lượng lấy vượt tồn kho khả dụng
    if (availableStock !== null && qty > availableStock) {
      showNotice(
        'error',
        `⚠️ Số lượng yêu cầu (${qty} ${item.unit}) vượt quá tồn kho khả dụng (${availableStock.toFixed(2)} ${item.unit}). Vui lòng kiểm tra lại!`
      );
      return;
    }

    try {
      setIsTakingOut(true);
      const branchId =
        user?.branchId ||
        (localStorage.getItem('senviet_current_branch')?.includes('Quế Võ') ? 2 : 1);
      const res = await kitchenApi.recordTakeOut({
        itemId: item.id,
        quantity: qty,
        unit: takeOutUnit || item.unit || 'kg',
        note: takeOutNote || 'Lấy hàng ra bếp sơ chế',
        branchId,
      });
      showNotice('success', res.message || `Đã xuất kho ${qty} ${takeOutUnit || item.unit} ${item.itemName}`);
      // TASK-S1-03 & TASK-LOGIC-01: Reset toàn bộ form lấy hàng về rỗng
      setTakeOutQty('');
      setTakeOutNote('');
      setActiveModal(null);

      // Cập nhật lại tồn kho ngay lập tức
      await fetchAvailableStock(item.id);

      // Cập nhật lại danh sách lấy hàng trong ca ngay lập tức
      const updatedLogs = await kitchenApi.getTakeOutLogs();
      setTakeOutLogs(updatedLogs);
    } catch (err: any) {
      showNotice('error', err.response?.data?.message || err.message || 'Lỗi khi lấy hàng');
    } finally {
      setIsTakingOut(false);
    }
  };

  // -------------------------------------------------------------
  // TASK-S1-03: HỦY THAO TÁC LẤY HÀNG NẾU LẤY NHẦM (HOÀN TRẢ LẠI KHO)
  // -------------------------------------------------------------
  const handleCancelTakeOut = async (log: TakeOutLog) => {
    if (log.isCancelled) return;
    try {
      setCancellingTakeOutId(log.id);
      const res = await kitchenApi.cancelTakeOut(log.id);
      showNotice('success', res.message);
      const updatedLogs = await kitchenApi.getTakeOutLogs();
      setTakeOutLogs(updatedLogs);
      if (selectedItemId) {
        await fetchAvailableStock(Number(selectedItemId));
      }
    } catch (err: any) {
      showNotice('error', err.message || 'Lỗi khi hủy thao tác lấy hàng');
    } finally {
      setCancellingTakeOutId(null);
    }
  };

  // -------------------------------------------------------------
  // Xử lý Nút 2: CHẾ BIẾN MẺ
  // -------------------------------------------------------------
  const handleStartBatchSubmit = async (force = false) => {
    if (!batchItemId || !batchInputWeight || batchInputWeight <= 0) {
      showNotice('error', 'Vui lòng nhập khối lượng đầu vào hợp lệ (> 0 kg)');
      return;
    }
    const item = items.find((i) => i.id === Number(batchItemId));
    if (!item) return;

    const reqData = {
      itemId: item.id,
      inputWeight: batchInputWeight,
      unit: item.unit,
      note: batchNote || undefined,
      forceSecondBatch: force,
    };

    try {
      setIsStartingBatch(true);
      if (!navigator.onLine) {
        localStorage.setItem('senviet_offline_start_batch', JSON.stringify(reqData));
        showNotice(
          'error',
          `⚠️ Mất kết nối mạng! Dữ liệu mẻ [${item.itemName} - ${batchInputWeight} kg] đã được lưu tạm trên máy. Vui lòng bấm 'Thử lại' khi có mạng lại.`
        );
        return;
      }
      const res = await kitchenApi.startBatch(reqData);
      localStorage.removeItem('senviet_offline_start_batch');
      showNotice('success', `Đã khởi tạo mẻ [${res.data.batchCode}] cho món ${item.itemName}`);
      setShowSecondBatchWarning(false);
      setPendingBatchRequest(null);
      // Reload danh sách mẻ đang làm
      const updatedBatches = await kitchenApi.getActiveBatches();
      setActiveBatches(updatedBatches);
      setActiveModal(null);
    } catch (err: any) {
      const isNetworkErr =
        !navigator.onLine ||
        err.code === 'ERR_NETWORK' ||
        err.message?.includes('Network Error') ||
        err.message?.includes('timeout') ||
        !err.response;

      if (isNetworkErr) {
        localStorage.setItem('senviet_offline_start_batch', JSON.stringify(reqData));
        showNotice(
          'error',
          `⚠️ Mất kết nối mạng! Dữ liệu cân mẻ ${batchInputWeight} kg đã được lưu tạm an toàn trên máy. Vui lòng bấm 'Thử lại' khi có mạng lại.`
        );
      } else if (err.response?.status === 409) {
        // Kích hoạt Modal Cảnh Báo Đỏ Mẻ Thứ Hai
        setPendingBatchRequest(reqData);
        setShowSecondBatchWarning(true);
      } else if (err.response?.status === 422) {
        // Giai đoạn 8: Chặn cứng do món có báo hỏng chờ Quản lý duyệt
        setUnapprovedDamageError(
          err.response?.data?.message ||
          'Món này đang có mẻ/lô báo hỏng chờ Quản lý duyệt. Vui lòng liên hệ Quản lý phê duyệt trước khi mở mẻ mới!'
        );
        setShowUnapprovedDamageModal(true);
      } else {
        showNotice('error', err.response?.data?.message || 'Lỗi khi tạo mẻ');
      }
    } finally {
      setIsStartingBatch(false);
    }
  };

  // TASK-WH-04: Xử lý chụp ảnh mặt bàn cân điện tử kèm Watermark tự động
  const handleFinishScalePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingScalePhoto(true);
      const res = await compressImage(file, 1280, 720, 0.75, {
        branchName:
          user?.branchName || (user?.branchId === 2 ? 'Sen Việt - Quế Võ' : 'Sen Việt - Thái Nguyên'),
        userName: user?.fullName || 'Bếp viên',
        docType: `Cân mẻ ${selectedFinishBatch?.batchCode || ''}`,
        docTypeName: `Cân mẻ ${selectedFinishBatch?.batchCode || ''}`,
      });
      setFinishScalePhoto(res.dataUrl);
      showNotice('success', 'Đã chụp & lưu ảnh mặt bàn cân kèm Watermark thành công!');
    } catch (err) {
      console.error('Lỗi khi nén ảnh bàn cân:', err);
      showNotice('error', 'Lỗi khi chụp hoặc nén ảnh mặt bàn cân');
    } finally {
      setIsCompressingScalePhoto(false);
      if (finishScalePhotoInputRef.current) finishScalePhotoInputRef.current.value = '';
    }
  };

  // Hoàn tất cân mẻ thành phẩm (TASK-WH-03: Blind Weighing & TASK-WH-04: Anti-Fraud Photo)
  const handleFinishBatchSubmit = async () => {
    if (!selectedFinishBatch) return;

    if (finishOutputWeight <= 0) {
      showNotice('error', '⚠️ Vui lòng nhập khối lượng thành phẩm hợp lệ (> 0 kg)');
      return;
    }

    // TASK-WH-04: Chặn cứng nếu chưa chụp ảnh bàn cân
    if (!finishScalePhoto) {
      showNotice(
        'error',
        '⚠️ BẮT BUỘC chụp ảnh mặt bàn cân điện tử hiển thị rõ số kg thành phẩm để chống gian lận!'
      );
      return;
    }

    try {
      setIsFinishingBatch(true);
      if (!navigator.onLine) {
        localStorage.setItem(
          `senviet_offline_finish_batch_${selectedFinishBatch.id}`,
          JSON.stringify({ weight: finishOutputWeight, photo: finishScalePhoto })
        );
        showNotice(
          'error',
          `⚠️ Mất kết nối mạng! Số cân thành phẩm ${finishOutputWeight} kg của mẻ [${selectedFinishBatch.batchCode}] đã được lưu tạm an toàn. Vui lòng bấm 'Thử lại' khi có mạng.`
        );
        return;
      }
      const res = await kitchenApi.finishBatch({
        batchId: selectedFinishBatch.id,
        outputWeight: finishOutputWeight,
        scalePhotoUrl: finishScalePhoto,
        requireScalePhoto: true,
      });

      localStorage.removeItem(`senviet_offline_finish_batch_${selectedFinishBatch.id}`);
      const batchData = res.data;

      // TASK-WH-03: TUYỆT ĐỐI KHÔNG hiện hao hụt thực tế, chuẩn hay cảnh báo lệch trước mắt Bếp viên!
      showNotice(
        'success',
        `✅ Đã ghi nhận số cân mẻ [${batchData.batchCode}] (${finishOutputWeight} kg) kèm ảnh bàn cân. Đã chuyển Quản lý đối soát!`
      );

      setSelectedFinishBatch(null);
      setFinishOutputWeight(0);
      setFinishScalePhoto(null);
      const updatedBatches = await kitchenApi.getActiveBatches();
      setActiveBatches(updatedBatches);
      setActiveModal(null);
    } catch (err: any) {
      const isNetworkErr =
        !navigator.onLine ||
        err.code === 'ERR_NETWORK' ||
        err.message?.includes('Network Error') ||
        err.message?.includes('timeout') ||
        !err.response;

      if (isNetworkErr) {
        localStorage.setItem(
          `senviet_offline_finish_batch_${selectedFinishBatch.id}`,
          JSON.stringify({ weight: finishOutputWeight, photo: finishScalePhoto })
        );
        showNotice(
          'error',
          `⚠️ Mất kết nối mạng! Dữ liệu cân mẻ ${finishOutputWeight} kg đã được lưu tạm an toàn trên máy. Vui lòng bấm 'Thử lại' khi có mạng lại.`
        );
      } else {
        showNotice('error', err.response?.data?.message || err.message || 'Lỗi khi hoàn thành mẻ');
      }
    } finally {
      setIsFinishingBatch(false);
    }
  };

  // -------------------------------------------------------------
  // TASK-FLOW-04: Xử lý Nút 3: RA LINE (+1) kèm Trừ Kho Sau Chế Biến, Cooldown 1.5s & Phản hồi Haptic/Visual
  // -------------------------------------------------------------
  const handleLineItemInc = async (target: Item | ProcessedDish) => {
    const isDish = 'dishCode' in target;
    const targetId = target.id;
    const currentBranchId =
      user?.branchId ||
      (localStorage.getItem('senviet_current_branch')?.includes('Quế Võ') ? 2 : 1);

    // Tìm món tương ứng trong Kho Sau Chế Biến
    let matchedDish: ProcessedDish | undefined = isDish
      ? (target as ProcessedDish)
      : processedDishes.find((d) => d.rawItemId === target.id);

    // CẢNH BÁO NẾU KHO SAU CHẾ BIẾN KHÔNG ĐỦ HOẶC HẾT HÀNG
    if (matchedDish && (matchedDish.quantity || 0) <= 0) {
      showNotice(
        'error',
        `⚠️ Món [${matchedDish.dishName}] trong Kho Sau Chế Biến đã hết tồn (0 ${matchedDish.unit})! Vui lòng nấu và cân mẻ tại NÚT 2 trước khi ra line!`
      );
      return;
    }

    // Khóa nút tối thiểu 1.5 giây sau mỗi lần bấm để tránh spam click
    if (loadingLineButtons[targetId] || cooldownButtons[targetId]) return;

    // Khóa nút tức thì & kích hoạt cooldown lock tối thiểu 1.5 giây (1500ms)
    setLoadingLineButtons((prev) => ({ ...prev, [targetId]: true }));
    setCooldownButtons((prev) => ({ ...prev, [targetId]: true }));

    // Kích hoạt hiệu ứng phản hồi: nảy số +1 (floating badge) và rung nhẹ phản hồi (haptic/visual)
    setAnimatingLineItemId(targetId);
    setShakingLineItemId(targetId);

    // Haptic feedback cho thiết bị màn hình cảm ứng / tablet bếp
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 30, 40]);
      } catch (e) {
        // Bỏ qua nếu trình duyệt không hỗ trợ hoặc bị chặn
      }
    }

    // Thời gian kết thúc hiệu ứng rung visual (400ms) và hiệu ứng floating badge (900ms)
    setTimeout(() => {
      setShakingLineItemId(null);
    }, 400);

    setTimeout(() => {
      setAnimatingLineItemId(null);
    }, 900);

    // Đảm bảo mở khóa cooldown tối thiểu 1.5 giây (1500ms)
    setTimeout(() => {
      setCooldownButtons((prev) => ({ ...prev, [targetId]: false }));
    }, 1500);

    // Sinh requestId duy nhất để server loại trừ request trùng khi mạng chập chờn
    const idempotencyRequestId = `line-${targetId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      await kitchenApi.recordLineItem({
        itemId: isDish ? (target as ProcessedDish).rawItemId : target.id,
        dishId: isDish ? target.id : matchedDish?.id,
        dishCode: isDish ? (target as ProcessedDish).dishCode : matchedDish?.dishCode,
        quantity: 1,
        branchId: currentBranchId,
        requestId: idempotencyRequestId,
      });

      // Cập nhật tồn kho sau chế biến trong state processedDishes
      if (matchedDish) {
        setProcessedDishes((prev) =>
          prev.map((d) => {
            if (d.id === matchedDish!.id) {
              const nextQty = Math.max(0, Number(((d.quantity || 0) - 1).toFixed(2)));
              return { ...d, quantity: nextQty, status: nextQty <= 0 ? 'OUT_OF_STOCK' : 'AVAILABLE' };
            }
            return d;
          })
        );
      }

      // Tăng counter hiển thị trên giao diện
      setLineCounters((prev) => ({
        ...prev,
        [targetId]: (prev[targetId] || 0) + 1,
      }));

      const dishName = isDish ? (target as ProcessedDish).dishName : (target as Item).itemName;
      showNotice('success', `+1 đĩa [${dishName}] đã ra line buffet! (Đã trừ tồn Kho Sau Chế Biến)`);
    } catch (err: any) {
      showNotice('error', err.response?.data?.message || err.message || 'Lỗi khi ghi nhận ra line');
    } finally {
      // Mở lại loading của nút sau khi request ghi nhận xong
      setLoadingLineButtons((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  // -------------------------------------------------------------
  // TASK-FLOW-05: Xử lý Nút 5: TẠO ĐỒ ĂN THỪA CUỐI CA (Bắt buộc có ảnh)
  // -------------------------------------------------------------
  const handleLeftoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingLeftoverPhoto(true);
      const res = await compressImage(file, 1280, 720, 0.75, {
        branchName:
          user?.branchName || (user?.branchId === 2 ? 'Sen Việt - Quế Võ' : 'Sen Việt - Thái Nguyên'),
        userName: user?.fullName || 'Bếp viên',
        docType: 'Đồ ăn thừa cuối ca',
        docTypeName: 'Đồ ăn thừa cuối ca',
      });
      setLeftoverPhoto(res);
      showNotice('success', 'Đã chụp & nén ảnh bàn cân thức ăn thừa kèm Watermark thành công');
    } catch (err) {
      console.error('Lỗi khi nén ảnh thức ăn thừa:', err);
      showNotice('error', 'Lỗi khi chụp ảnh thức ăn thừa');
    } finally {
      setIsCompressingLeftoverPhoto(false);
      if (leftoverPhotoInputRef.current) leftoverPhotoInputRef.current.value = '';
    }
  };

  const handleLeftoverWasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = typeof leftoverQty === 'string' ? parseFloat(leftoverQty) : leftoverQty;
    if (!leftoverQty || isNaN(qty) || qty <= 0) {
      showNotice('error', 'Vui lòng nhập số lượng thức ăn thừa hợp lệ (> 0)');
      return;
    }

    // VALIDATE CHẶN CỨNG: BẮT BUỘC ẢNH CHỤP ĐÍNH KÈM
    if (!leftoverPhoto || !leftoverPhoto.dataUrl) {
      showNotice('error', '⚠️ BẮT BUỘC phải chụp ảnh mặt bàn cân hoặc đĩa thức ăn thừa đính kèm để chống gian lận!');
      return;
    }

    try {
      setIsSubmittingLeftover(true);
      const selDish = processedDishes.find((d) => d.id === Number(leftoverDishId));
      const finalItemName = selDish?.dishName || leftoverItemName || 'Thức ăn thừa cuối ca';
      const currentBranchId =
        user?.branchId ||
        (localStorage.getItem('senviet_current_branch')?.includes('Quế Võ') ? 2 : 1);

      await kitchenApi.recordLeftoverWaste({
        dishId: selDish?.id,
        itemId: selDish?.rawItemId,
        itemName: finalItemName,
        quantity: qty,
        unit: leftoverUnit || selDish?.unit || 'đĩa',
        locationType: leftoverLocation,
        reason: leftoverReason,
        imageUrl: leftoverPhoto.dataUrl,
        note: leftoverNote,
        shift: leftoverShift,
        branchId: currentBranchId,
      });

      showNotice(
        'success',
        `✅ Đã ghi nhận ${qty} ${leftoverUnit} thức ăn thừa [${finalItemName}] (${leftoverLocation === 'LINE' ? 'Quầy Line' : 'Kho Bếp'}) thành công!`
      );
      setActiveModal(null);
      setLeftoverQty('');
      setLeftoverNote('');
      setLeftoverPhoto(null);
      loadInitialData();
    } catch (err: any) {
      console.error('Lỗi khi ghi nhận thức ăn thừa:', err);
      showNotice('error', err.response?.data?.message || err.message || 'Lỗi khi ghi nhận thức ăn thừa');
    } finally {
      setIsSubmittingLeftover(false);
    }
  };

  // -------------------------------------------------------------
  // Xử lý Nút 4: BÁO HỎNG & Nén Ảnh Canvas
  // -------------------------------------------------------------
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      // Nén ảnh Canvas về max 1280x720, quality 0.75, <= 250KB
      const result = await compressImage(file, 1280, 720, 0.75);
      setDamageImage(result);
    } catch (err) {
      console.error('Lỗi nén ảnh:', err);
      showNotice('error', 'Không thể nén ảnh, vui lòng thử lại');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDamageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!damageItemId || damageQty <= 0) return;

    const damagePayload = {
      itemId: Number(damageItemId),
      quantity: damageQty,
      reason: damageReason,
      supplierCode: damageReason === 'HONG_DO_NHA_CUNG_CAP' ? damageSupplier : undefined,
      batchNumber: selectedBatchCode || undefined,
      note: damageNote || undefined,
      imageUrls: damageImage?.dataUrl || undefined,
    };

    try {
      setIsSubmittingDamage(true);
      if (!navigator.onLine) {
        localStorage.setItem('senviet_offline_damage_report', JSON.stringify(damagePayload));
        showNotice(
          'error',
          `⚠️ Mất kết nối mạng! Dữ liệu báo hỏng (${damageQty} kg) đã được lưu tạm an toàn trên máy. Vui lòng bấm "Thử lại" khi có mạng.`
        );
        return;
      }

      const res = await kitchenApi.recordDamageReport(damagePayload);
      localStorage.removeItem('senviet_offline_damage_report');

      const report = res.data;
      if (report.status === 'TU_DONG_DUYET') {
        showNotice('success', `✅ Đơn báo hỏng đã được TỰ ĐỘNG DUYỆT (Giá trị: ${Number(report.estimatedValue).toLocaleString('vi-VN')} đ)`);
      } else {
        showNotice('error', `⚠️ Đơn báo hỏng giá trị cao (${Number(report.estimatedValue).toLocaleString('vi-VN')} đ) đang CHỜ QUẢN LÝ DUYỆT`);
      }

      setDamageNote('');
      setDamageImage(null);
      setActiveModal(null);

      // TASK-S1-05: Cập nhật lại danh sách báo hỏng đã gửi ca này ngay lập tức
      const updatedReports = await kitchenApi.getDamageReports();
      setDamageReports(updatedReports);
    } catch (err: any) {
      const isNetworkErr =
        !navigator.onLine ||
        err.code === 'ERR_NETWORK' ||
        err.message?.includes('Network Error') ||
        err.message?.includes('timeout') ||
        !err.response;

      if (isNetworkErr) {
        localStorage.setItem('senviet_offline_damage_report', JSON.stringify(damagePayload));
        showNotice(
          'error',
          `⚠️ Mất kết nối mạng! Dữ liệu báo hỏng (${damageQty} kg) đã được lưu tạm trên máy. Vui lòng bấm "Thử lại" khi mạng ổn định.`
        );
      } else {
        showNotice('error', err.response?.data?.message || 'Lỗi khi gửi báo hỏng');
      }
    } finally {
      setIsSubmittingDamage(false);
    }
  };

  // -------------------------------------------------------------
  // GIAI ĐOẠN 8: Xử lý Món Dùng Trong Ngày Cuối Ca
  // -------------------------------------------------------------
  const handleOpenDailyWasteModal = async () => {
    try {
      setIsLoadingDailyItems(true);
      setShowDailyWasteModal(true);
      const list = await kitchenApi.getDailyOnlyRemaining();
      setDailyItems(list);
      // Pre-fill quantities
      const initialQtys: { [id: number]: number } = {};
      list.forEach((item) => {
        initialQtys[item.id] = item.remainingStock || item.suggestedWasteQty || 0;
      });
      setDailyWasteQuantities(initialQtys);
    } catch (err: any) {
      console.error('Lỗi nạp danh sách món dùng trong ngày:', err);
      showNotice('error', 'Không thể nạp danh sách món dùng trong ngày');
    } finally {
      setIsLoadingDailyItems(false);
    }
  };

  const handleSubmitDailyWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemsToWaste = dailyItems
      .filter((it) => (dailyWasteQuantities[it.id] || 0) > 0)
      .map((it) => ({
        itemId: it.itemId || it.id,
        quantity: dailyWasteQuantities[it.id] || 0,
        unit: it.unit,
        note: dailyWasteItemNotes[it.id] || undefined,
      }));

    if (itemsToWaste.length === 0) {
      showNotice('error', 'Vui lòng nhập số lượng ghi bỏ cho ít nhất 1 món');
      return;
    }

    try {
      setIsSubmittingDailyWaste(true);
      const req: ConfirmDailyWasteRequest = {
        shift: dailyWasteShift,
        wasteDate: dailyWasteDate,
        note: dailyWasteGeneralNote || undefined,
        items: itemsToWaste,
      };

      await kitchenApi.confirmDailyWaste(req);
      showNotice(
        'success',
        `✅ Đã xác nhận ghi bỏ ${itemsToWaste.length} món dùng trong ngày thành công! Đã hạch toán vào Hỏng/bỏ có báo.`
      );
      setShowDailyWasteModal(false);
      loadInitialData();
    } catch (err: any) {
      console.error('Lỗi khi ghi bỏ món trong ngày:', err);
      showNotice('error', err.response?.data?.message || 'Lỗi khi xác nhận ghi bỏ');
    } finally {
      setIsSubmittingDailyWaste(false);
    }
  };

  // -------------------------------------------------------------
  // GIAI ĐOẠN 8: Xử lý Thêm Món Nhanh Ra Line
  // -------------------------------------------------------------
  const handleQuickAddLineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickItemName.trim()) {
      showNotice('error', 'Tên món không được để trống');
      return;
    }

    try {
      setIsSubmittingQuickAdd(true);
      const newItem = await kitchenApi.quickAddLineItem({
        itemName: quickItemName.trim(),
        category: quickItemCategory,
        unit: quickItemUnit,
        costPrice: quickItemCostPrice || 50000,
        isDailyOnly: quickIsDailyOnly,
      });

      setItems((prev) => [...prev, newItem]);
      showNotice('success', `✅ Đã thêm món "${newItem.itemName}" vào thực đơn ra line thành công!`);
      setShowQuickAddModal(false);
      setQuickItemName('');
      setQuickIsDailyOnly(false);
    } catch (err: any) {
      console.error('Lỗi khi thêm món nhanh:', err);
      showNotice('error', err.response?.data?.message || 'Lỗi khi thêm món nhanh ra line');
    } finally {
      setIsSubmittingQuickAdd(false);
    }
  };

  // Tính giá trị ước tính của đơn báo hỏng
  const selectedDamageItem = items.find((i) => i.id === Number(damageItemId));
  const estimatedDamageCost = (selectedDamageItem?.costPrice || 0) * (damageQty || 0);
  const isAutoApprove = estimatedDamageCost <= 500000;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600 mb-2" />
        <span className="text-sm font-medium">Đang tải dữ liệu quầy Bếp & Bar...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto lg:max-w-none lg:w-full lg:h-[calc(100vh-100px)] lg:overflow-hidden lg:grid lg:grid-cols-[300px_1fr_420px] lg:gap-4 space-y-4 lg:space-y-0 pb-8 lg:pb-0 font-sans">
      {/* ══════════════════════════════════════════════════════════════
          CỘT 1 (TRÁI - 300px): BÀN ĐIỀU KHIỂN & TÁC VỤ CHÍNH (TASK-PC-01)
      ══════════════════════════════════════════════════════════════ */}
      <div className="lg:h-full lg:overflow-y-auto space-y-3 pr-0 lg:pr-1 flex flex-col">
        {/* Thông báo Alert Toast */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl flex items-center justify-between shadow-md transition-all animate-in fade-in slide-in-from-top-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border border-rose-300 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
              )}
              <span className="text-xs font-medium">{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Header Panel tóm tắt ca làm việc của Bếp */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
              {user?.branchName || 'Sen Việt Buffet'}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Bảng Vận Hành Bếp & Bar</h2>
            <p className="text-xs text-slate-500">
              Người thực hiện: <span className="font-semibold text-slate-700">{user?.fullName}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeBatches.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                <Flame className="h-3 w-3" />
                {activeBatches.length} mẻ
              </span>
            )}
            <button
              onClick={loadInitialData}
              title="Tải lại dữ liệu"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* CẢNH BÁO MẺ DỞ DANG NỔI BẬT (BANNER ĐỎ / AMBER) */}
        {activeBatches.length > 0 && (
          <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-red-600 rounded-2xl p-3.5 text-white shadow-lg shadow-rose-600/20 border-2 border-amber-300 animate-in fade-in flex flex-col gap-2.5">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md flex-shrink-0 animate-pulse">
                <Flame className="h-5 w-5 text-amber-200" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-black text-xs sm:text-sm tracking-tight">
                    CẢNH BÁO: CÓ {activeBatches.length} MẺ CHƯA CÂN!
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 text-[9px] font-black uppercase tracking-wider">
                    Cần cân
                  </span>
                </div>
                <p className="text-[11px] text-amber-100/90 mt-0.5">
                  Cân thành phẩm để khóa định mức hao hụt mẻ.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setBatchTab('finish');
                setSelectedFinishBatch(activeBatches[0]);
                const savedDraft = localStorage.getItem(`senviet_offline_finish_batch_${activeBatches[0].id}`);
                if (savedDraft) {
                  setFinishOutputWeight(parseFloat(savedDraft));
                } else {
                  setFinishOutputWeight(
                    activeBatches[0].inputWeight ? Math.round(activeBatches[0].inputWeight * 0.8 * 10) / 10 : 0
                  );
                }
                setActiveModal('batch');
              }}
              className="btn-touch w-full py-2.5 rounded-xl bg-white text-rose-700 hover:bg-amber-50 font-black text-xs shadow flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Scale className="h-4 w-4 text-rose-600" />
              <span>TIẾP TỤC MẺ TRƯỚC</span>
            </button>
          </div>
        )}

        {/* KHO-13: NÚT CÂN HÀNG MỚI VỀ (BẾP NHẬN HÀNG NCC TRỰC TIẾP) */}
        <button
          type="button"
          onClick={() => setShowReceiveModal(true)}
          className="w-full btn-touch p-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white flex items-center justify-between shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0 text-left">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-sm tracking-tight uppercase truncate">
                  ⚖️ Cân Hàng Mới Về
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-white text-orange-800 uppercase shadow-xs shrink-0">
                  Bếp Nhận
                </span>
              </div>
              <p className="text-[11px] text-orange-100 truncate mt-0.5">
                Cân thực tế + Chụp ảnh ➔ Kế toán
              </p>
            </div>
          </div>
          <div className="p-1 rounded-lg bg-white/10 shrink-0">
            <ArrowRight className="h-4 w-4 text-white" />
          </div>
        </button>

        {/* 5 NÚT BẤM TÁC VỤ CHÍNH CHO BẾP (SPEC-KITCHEN-5-BUTTONS-DUAL-INVENTORY-2026) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* NÚT 1: LẤY HÀNG (Màu Xanh Dương) */}
          <button
            onClick={() => {
              setTakeOutQty('');
              setTakeOutNote('');
              setActiveModal('takeOut');
              if (selectedItemId) {
                fetchAvailableStock(Number(selectedItemId));
              }
            }}
            className="btn-touch min-h-[90px] rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 hover:from-blue-700 hover:to-indigo-900 text-white p-3 flex flex-col justify-between shadow-md shadow-blue-600/20 active:scale-[0.97] transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-black/25 uppercase">Nút 1</span>
            </div>
            <div>
              <div className="font-black text-sm sm:text-base leading-tight">LẤY HÀNG</div>
              <div className="text-[11px] text-blue-100 mt-0.5">Kho trước chế biến</div>
            </div>
          </button>

          {/* NÚT 2: CHẾ BIẾN MẺ (Màu Xanh Lá) */}
          <button
            onClick={() => {
              setBatchTab(activeBatches.length > 0 ? 'finish' : 'start');
              setBatchInputWeight(0);
              setBatchNote('');
              setActiveModal('batch');
            }}
            className="btn-touch min-h-[90px] rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white p-3 flex flex-col justify-between shadow-md shadow-emerald-600/20 active:scale-[0.97] transition-all text-left relative overflow-hidden cursor-pointer"
          >
            {activeBatches.length > 0 && (
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-300"></span>
              </span>
            )}
            <div className="flex items-center justify-between w-full">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-black/25 uppercase">Nút 2</span>
            </div>
            <div>
              <div className="font-black text-sm sm:text-base leading-tight">CHẾ BIẾN MẺ</div>
              <div className="text-[11px] text-emerald-100 mt-0.5">
                {activeBatches.length > 0 ? `${activeBatches.length} mẻ chờ cân` : 'Nhập Kho Sau'}
              </div>
            </div>
          </button>

          {/* NÚT 3: RA LINE (+1) (Màu Vàng / Hổ Phách) */}
          <button
            onClick={() => setActiveModal('lineItem')}
            className="btn-touch min-h-[90px] rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 hover:from-amber-600 hover:to-orange-800 text-white p-3 flex flex-col justify-between shadow-md shadow-amber-500/20 active:scale-[0.97] transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <PlusCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-black/25 uppercase">Nút 3</span>
            </div>
            <div>
              <div className="font-black text-sm sm:text-base leading-tight">RA LINE (+1)</div>
              <div className="text-[11px] text-amber-100 mt-0.5">Trừ Kho Sau Chế Biến</div>
            </div>
          </button>

          {/* NÚT 4: BÁO HỎNG (Màu Đỏ Rose) */}
          <button
            onClick={() => setActiveModal('damage')}
            className="btn-touch min-h-[90px] rounded-xl bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 hover:from-rose-700 hover:to-red-900 text-white p-3 flex flex-col justify-between shadow-md shadow-rose-600/20 active:scale-[0.97] transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-black/25 uppercase">Nút 4</span>
            </div>
            <div>
              <div className="font-black text-sm sm:text-base leading-tight">BÁO HỎNG</div>
              <div className="text-[11px] text-rose-100 mt-0.5">Ảnh nén &lt;200KB</div>
            </div>
          </button>
        </div>

        {/* NÚT 5: ĐỒ ĂN THỪA CUỐI CA (Màu Tím / Indigo - Full width) */}
        <button
          onClick={() => {
            setLeftoverQty('');
            setLeftoverNote('');
            setLeftoverPhoto(null);
            setActiveModal('leftoverWaste');
          }}
          className="btn-touch w-full min-h-[68px] rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-violet-800 hover:from-purple-800 hover:to-violet-900 text-white p-3 flex items-center justify-between shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
              <Trash2 className="h-5 w-5 text-purple-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-sm tracking-tight uppercase truncate">
                  ĐỒ ĂN THỪA CUỐI CA
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-purple-200 text-purple-900 uppercase shrink-0">
                  Nút 5
                </span>
              </div>
              <p className="text-[11px] text-purple-200 truncate mt-0.5">
                Thừa trên line / bếp • Bắt buộc ảnh chụp bàn cân
              </p>
            </div>
          </div>
          <div className="p-1 rounded-lg bg-white/10 shrink-0">
            <ArrowRight className="h-4 w-4 text-white" />
          </div>
        </button>

        {/* XỬ LÝ MÓN TƯƠI CHỈ DÙNG TRONG NGÀY CUỐI CA */}
        <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 rounded-2xl p-2.5 text-white shadow-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-xl bg-white/20 backdrop-blur-sm flex-shrink-0">
              <Salad className="h-4 w-4 text-emerald-200" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-[11px] leading-tight truncate">
                MÓN DÙNG TRONG NGÀY
              </div>
              <p className="text-[10px] text-emerald-100/90 truncate">
                Kiểm đếm salad, kim chi cuối ca
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenDailyWasteModal}
            className="btn-touch px-2 py-1 rounded-xl bg-white text-emerald-900 font-extrabold text-[10px] hover:bg-emerald-50 flex items-center gap-1 shadow-xs active:scale-95 transition-all flex-shrink-0 cursor-pointer"
          >
            <span>XỬ LÝ</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          CỘT 2 (GIỮA - FLEX-1): QUẦY BUFFET RA LINE & MẺ ĐANG NẤU (TASK-PC-01)
      ══════════════════════════════════════════════════════════════ */}
      <div className="lg:h-full lg:overflow-y-auto space-y-3 px-0 lg:px-1 min-w-0 flex flex-col">
        {/* DANH SÁCH MẺ ĐANG CHẾ BIẾN DỞ DANG (NẾU CÓ) */}
        {activeBatches.length > 0 && (
          <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                <Flame className="h-4 w-4 text-amber-600 animate-pulse" />
                <span>Mẻ đang chế biến chưa cân thành phẩm ({activeBatches.length})</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeBatches.map((b) => (
                <div
                  key={b.id}
                  className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-800 text-xs truncate">{b.itemName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Vào: <strong className="text-brand-600 font-mono">{b.inputWeight} kg</strong> •{' '}
                      <span className="font-mono text-[10px] bg-slate-100 px-1 rounded">{b.batchCode}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFinishBatch(b);
                      const savedDraft = localStorage.getItem(`senviet_offline_finish_batch_${b.id}`);
                      if (savedDraft) {
                        setFinishOutputWeight(parseFloat(savedDraft));
                        showNotice('success', `Đã khôi phục số cân lưu tạm: ${savedDraft} kg`);
                      } else {
                        setFinishOutputWeight(b.inputWeight ? Math.round(b.inputWeight * 0.8 * 10) / 10 : 0);
                      }
                      setBatchTab('finish');
                      setActiveModal('batch');
                    }}
                    className="btn-touch px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs shrink-0 cursor-pointer"
                  >
                    <Scale className="h-3.5 w-3.5" />
                    <span>Cân Xong</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUẦY BUFFET RA LINE TRỰC QUAN */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex-1 flex flex-col space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Utensils className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <span>Quầy Buffet Ra Line (+1 Đĩa)</span>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Kho Sau Chế Biến & CukCuk
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Khấu trừ tức thời tồn Kho Sau Chế Biến & đối soát bán lẻ CukCuk POS.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickAddModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Thêm món</span>
            </button>
          </div>

          {/* Thanh tìm kiếm & lọc Station */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm món ra line (Phím / hoặc F2)..."
                value={lineSearchTerm}
                onChange={(e) => setLineSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>
            {/* Station Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'BEP_NONG', label: 'Bếp Nóng' },
                { key: 'BEP_LANH', label: 'Bếp Lạnh' },
                { key: 'BAR', label: 'Bar' },
                { key: 'RA_LINE', label: 'Line Buffet' },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setSelectedStation(st.key as KitchenStation)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedStation === st.key
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid các món ăn ra line (2 - 3 cột tuỳ chiều ngang) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
            {(processedDishes.length > 0 ? processedDishes : (items as any[]))
              .filter((it: any) => {
                const name = it.dishName || it.itemName || '';
                const code = it.dishCode || it.itemCode || '';
                return (
                  name.toLowerCase().includes(lineSearchTerm.toLowerCase()) ||
                  code.toLowerCase().includes(lineSearchTerm.toLowerCase())
                );
              })
              .map((item: any) => {
                const isDish = 'dishCode' in item;
                const itemId = item.id;
                const isLoadingBtn = !!loadingLineButtons[itemId];
                const isCooldown = !!cooldownButtons[itemId];
                const isLocked = isLoadingBtn || isCooldown;
                const countToday = lineCounters[itemId] || 0;
                const isAnimating = animatingLineItemId === itemId;
                const isShaking = shakingLineItemId === itemId;
                const currentStock = isDish ? (item.quantity ?? 0) : 10;
                const isOutOfStock = currentStock <= 0;
                const name = item.dishName || item.itemName;
                const unit = item.unit || 'đĩa';

                return (
                  <div
                    key={itemId}
                    className={`relative p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2 overflow-hidden transition-all ${
                      isShaking ? 'ring-2 ring-amber-400 animate-haptic-shake' : 'hover:border-amber-300'
                    }`}
                  >
                    {isAnimating && (
                      <div className="absolute top-1 right-2 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px] shadow-lg animate-float-up flex items-center gap-1 z-20 pointer-events-none">
                        <Check className="h-3 w-3" />
                        <span>+1 {unit}!</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-slate-900 truncate" title={name}>
                        {name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-slate-600">Kho sau:</span>
                        <span
                          className={`font-mono font-black ${
                            isOutOfStock
                              ? 'text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-200'
                              : 'text-emerald-700'
                          }`}
                        >
                          {currentStock} {unit}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>Đã ra:</span>
                        <span
                          className={`font-mono font-black ${
                            isAnimating ? 'text-emerald-600 scale-110' : 'text-amber-700'
                          }`}
                        >
                          {countToday}
                        </span>
                        <span>{unit}</span>
                      </div>
                      {isOutOfStock && (
                        <div className="text-[10px] font-bold text-rose-700 mt-0.5 flex items-center gap-0.5">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Hết kho sau chế biến (Cần Nút 2)</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLineItemInc(item)}
                      disabled={isLocked || isOutOfStock}
                      className={`px-3 py-2 rounded-xl text-white font-black text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all shrink-0 ${
                        isOutOfStock
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                          : isLocked
                          ? 'bg-amber-300 cursor-not-allowed opacity-80'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20 cursor-pointer'
                      }`}
                    >
                      {isLoadingBtn ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      <span>+1</span>
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          CỘT 3 (PHẢI - 420px): LỊCH SỬ LẤY HÀNG & ĐƠN BÁO HỎNG (TASK-PC-01)
      ══════════════════════════════════════════════════════════════ */}
      <div className="lg:h-full lg:overflow-y-auto space-y-3 pl-0 lg:pl-1 flex flex-col">
        {/* ============================================================== */}
        {/* TASK-S1-03: BẢNG LỊCH SỬ LẤY HÀNG TRONG CA HÔM NAY             */}
        {/* ============================================================== */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Lịch Sử Lấy Hàng Trong Ca</h3>
                <p className="text-[11px] text-slate-500">
                  Xuất kho ra bếp sơ chế. Hỗ trợ hủy thao tác hoàn kho.
                </p>
              </div>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
              {takeOutLogs.length} lần
            </span>
          </div>

          {takeOutLogs.length === 0 ? (
            <div className="text-center py-6 text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
              <Package className="h-7 w-7 mx-auto mb-1 text-slate-300" />
              <p className="text-xs font-semibold">Chưa có lượt lấy hàng nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-2.5">Giờ</th>
                    <th className="py-2 px-2.5">Tên nguyên liệu</th>
                    <th className="py-2 px-2.5 text-right">SL</th>
                    <th className="py-2 px-2.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {takeOutLogs.map((log) => {
                    const isCancelled = log.isCancelled || log.status === 'CANCELLED';
                    const timeStr = log.createdAt ? log.createdAt.slice(11, 16) : '--:--';
                    return (
                      <tr
                        key={log.id}
                        className={`transition-colors ${
                          isCancelled ? 'bg-slate-50/80 opacity-60' : 'hover:bg-blue-50/40'
                        }`}
                      >
                        <td className="py-2 px-2.5 font-mono font-bold text-slate-600 whitespace-nowrap">
                          {timeStr}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-slate-800">
                          <div className="truncate max-w-[130px]" title={log.item?.itemName}>
                            {log.item?.itemName || 'Nguyên liệu'}
                          </div>
                        </td>
                        <td className="py-2 px-2.5 text-right whitespace-nowrap">
                          <span
                            className={`font-mono font-black ${
                              isCancelled ? 'line-through text-slate-400' : 'text-blue-700'
                            }`}
                          >
                            {log.quantity}
                          </span>{' '}
                          <span className="text-[10px] text-slate-500">{log.unit || log.item?.unit}</span>
                        </td>
                        <td className="py-2 px-2.5 text-center whitespace-nowrap">
                          {isCancelled ? (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              Đã hoàn
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCancelTakeOut(log)}
                              disabled={cancellingTakeOutId === log.id}
                              className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[10px] transition-all inline-flex items-center gap-0.5"
                              title="Hủy lần xuất này nếu lấy nhầm"
                            >
                              {cancellingTakeOutId === log.id ? (
                                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              ) : (
                                <Undo2 className="h-2.5 w-2.5 text-rose-600" />
                              )}
                              <span>Hủy</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* TASK-S1-05: BẢNG THEO DÕI ĐƠN BÁO HỎNG ĐÃ GỬI CA NÀY          */}
        {/* ============================================================== */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Đơn Báo Hỏng Trong Ca</h3>
                <p className="text-[11px] text-slate-500">
                  Tình trạng duyệt từ Bếp trưởng & Quản lý.
                </p>
              </div>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
              {damageReports.length} đơn
            </span>
          </div>

          {damageReports.length === 0 ? (
            <div className="text-center py-6 text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
              <AlertTriangle className="h-7 w-7 mx-auto mb-1 text-slate-300" />
              <p className="text-xs font-semibold">Chưa có đơn báo hỏng nào trong ca</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {damageReports.map((report) => {
                const timeStr = report.createdAt ? report.createdAt.slice(11, 16) : '--:--';
                const isPending = report.status === 'CHO_DUYET';
                const isApproved = report.status === 'DA_DUYET' || report.status === 'TU_DONG_DUYET';
                const isRejected = report.status === 'TU_CHOI';

                return (
                  <div
                    key={report.id}
                    className={`p-3 rounded-xl border transition-all space-y-2 ${
                      isPending
                        ? 'bg-amber-50/60 border-amber-200'
                        : isApproved
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {report.item?.itemName}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-slate-700 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                            {report.quantity} {report.item?.unit}
                          </span>
                        </div>
                        <div className="text-[11px] text-rose-700 font-extrabold mt-0.5">
                          {report.estimatedValue ? Number(report.estimatedValue).toLocaleString('vi-VN') : '0'} đ
                        </div>
                      </div>

                      {/* Badge trạng thái */}
                      <div className="shrink-0 text-right">
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 inline-block">
                            🟡 Chờ duyệt
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 inline-block">
                            🟢 Đã duyệt
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 inline-block">
                            🔴 Từ chối
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{timeStr}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span className="truncate max-w-[180px]">
                        Lý do: {report.reason === 'HONG_SO_CHE_NAU' ? 'Sơ chế/nấu' : report.reason === 'HONG_DO_NHA_CUNG_CAP' ? 'Nguyên liệu từ NCC' : 'Thừa cuối ca'}
                      </span>
                      {report.imageUrls && (
                        <button
                          type="button"
                          onClick={() => setViewingDamageImage(report.imageUrls || null)}
                          className="font-bold text-brand-600 hover:text-brand-800 underline flex items-center gap-1 cursor-pointer"
                        >
                          <ImageIcon className="h-3 w-3" />
                          <span>Xem ảnh</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Phóng To Xem Ảnh Báo Hỏng */}
          {viewingDamageImage && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl p-4 max-w-lg w-full space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="font-bold text-sm text-slate-800">Ảnh minh chứng báo hỏng</span>
                  <button onClick={() => setViewingDamageImage(null)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <img src={viewingDamageImage} alt="Ảnh báo hỏng" className="w-full max-h-[70vh] object-contain rounded-xl" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: LẤY HÀNG RA BẾP (KHO TRƯỚC CHẾ BIẾN)                  */}
      {/* ============================================================== */}
      {activeModal === 'takeOut' && (() => {
        const filteredTakeOutItems = items.filter((it) => {
          if (selectedPreCategory === 'ALL') return true;
          return (
            getItemPreProcessingCategory(it.category, undefined, it.itemName, it.itemCode) ===
            selectedPreCategory
          );
        });

        const selectedTakeOutItem =
          items.find((i) => i.id === Number(selectedItemId)) || filteredTakeOutItems[0];
        const currentTakeOutQty = typeof takeOutQty === 'string' ? parseFloat(takeOutQty) : takeOutQty;
        const currentUnit = takeOutUnit || selectedTakeOutItem?.unit || 'kg';
        const isTakeOutOverStock = Boolean(
          availableStock !== null &&
          typeof currentTakeOutQty === 'number' &&
          !isNaN(currentTakeOutQty) &&
          currentTakeOutQty > availableStock
        );
        const isTakeOutInvalid = !takeOutQty || isNaN(currentTakeOutQty) || currentTakeOutQty <= 0;

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-base">
                  <Package className="h-6 w-6" />
                  <span>NÚT 1: LẤY HÀNG (KHO TRƯỚC CHẾ BIẾN)</span>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Callout quy chuẩn Kho Trước Chế Biến */}
              <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Quy chuẩn Kho Trước Chế Biến (TASK-FLOW-02):</strong> Chỉ xuất các nguyên liệu thô thuộc 11 nhóm danh mục mang ra bếp sơ chế/chế biến. Số lượng xuất sẽ trừ trực tiếp tồn kho trước chế biến.
                </span>
              </div>

              <form onSubmit={handleTakeOutSubmit} className="space-y-4 mt-3">
                {/* 11 Nhóm Danh Mục Kho Trước Chế Biến Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    NHÓM KHO TRƯỚC CHẾ BIẾN (11 NHÓM)
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPreCategory('ALL');
                      }}
                      className={`btn-touch px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                        selectedPreCategory === 'ALL'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Tất cả 11 nhóm
                    </button>
                    {PRE_PROCESSING_CATEGORIES.map((cat) => (
                      <button
                        key={cat.code}
                        type="button"
                        onClick={() => {
                          setSelectedPreCategory(cat.code);
                          const matching = items.filter(
                            (it) =>
                              getItemPreProcessingCategory(it.category, undefined, it.itemName, it.itemCode) ===
                              cat.code
                          );
                          if (matching.length > 0) {
                            setSelectedItemId(matching[0].id);
                            setTakeOutUnit(matching[0].unit || 'kg');
                            fetchAvailableStock(matching[0].id);
                          }
                        }}
                        className={`btn-touch px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                          selectedPreCategory === cat.code
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name.split(' (')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">MÓN ĂN / NGUYÊN LIỆU THÔ</label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => {
                      const newId = Number(e.target.value);
                      setSelectedItemId(newId);
                      const sel = items.find((i) => i.id === newId);
                      if (sel?.unit) setTakeOutUnit(sel.unit);
                      fetchAvailableStock(newId);
                    }}
                    className="w-full h-12 px-3 rounded-xl border border-slate-300 font-bold text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {filteredTakeOutItems.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.itemName} ({i.unit}) - [{i.barcode || i.itemCode}]
                      </option>
                    ))}
                  </select>

                  {/* TASK-LOGIC-01: Nhãn trực quan tồn kho khả dụng hiện tại */}
                  <div className="mt-2 px-3.5 py-2.5 rounded-xl bg-blue-50/90 border border-blue-200 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-blue-900 font-semibold">
                      <Package className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Tồn kho khả dụng hiện tại:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLoadingStock ? (
                        <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang kiểm tra...
                        </span>
                      ) : (
                        <>
                          <span className="font-mono font-black text-sm text-blue-700">
                            {availableStock !== null ? availableStock.toFixed(2) : '0.00'}{' '}
                            {selectedTakeOutItem?.unit || 'kg'}
                          </span>
                          {availableStock !== null && availableStock <= 0 && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded">
                              HẾT HÀNG
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Số lượng lấy & Đơn vị tính đa dạng (kg, cái, lít, con, gói) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-600">SỐ LƯỢNG LẤY</label>
                    <span className="text-xs font-bold text-blue-700">
                      Đơn vị: {currentUnit.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      placeholder="Nhập số lượng..."
                      value={takeOutQty}
                      onChange={(e) => {
                        const val = e.target.value.replace(',', '.');
                        setTakeOutQty(val === '' ? '' : parseFloat(val) || 0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === ',') {
                          e.preventDefault();
                          const cur = String(takeOutQty ?? '');
                          if (!cur.includes('.')) {
                            setTakeOutQty(((cur ? cur : '0') + '.') as any);
                          }
                        }
                      }}
                      className={`flex-1 h-12 px-4 rounded-xl border font-extrabold text-xl transition-all ${
                        isTakeOutOverStock
                          ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500 focus:outline-none focus:ring-rose-500'
                          : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500'
                      }`}
                    />
                    <div className="flex gap-1.5">
                      {[5, 10, 20].map((inc) => (
                        <button
                          type="button"
                          key={inc}
                          onClick={() => setTakeOutQty(inc)}
                          className="btn-touch px-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700"
                        >
                          {inc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lựa chọn ĐVT đa dạng: kg, cái, lít, con, gói */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-xs font-bold text-slate-500 mr-1">ĐVT:</span>
                    {['kg', 'cái', 'lít', 'con', 'gói'].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setTakeOutUnit(u)}
                        className={`btn-touch px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          currentUnit === u
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>

                  {/* Cảnh báo đỏ khi vượt tồn kho khả dụng */}
                  {isTakeOutOverStock && (
                    <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-300 flex items-start gap-2 text-xs font-bold text-rose-700 animate-in fade-in">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                      <span>
                        ⚠️ Số lượng yêu cầu ({currentTakeOutQty} {currentUnit}) vượt quá tồn kho khả dụng ({availableStock?.toFixed(2)} {selectedTakeOutItem?.unit || 'kg'}). Vui lòng kiểm tra lại!
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">GHI CHÚ (TÙY CHỌN)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Xuất sơ chế ca trưa..."
                    value={takeOutNote}
                    onChange={(e) => setTakeOutNote(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isTakingOut || isTakeOutInvalid || isTakeOutOverStock || (availableStock !== null && availableStock <= 0)}
                    className="btn-touch w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:text-slate-500 disabled:shadow-none text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    {isTakingOut ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        <span>XÁC NHẬN LẤY HÀNG (TRỪ KHO TRƯỚC)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ============================================================== */}
      {/* MODAL 2: CHẾ BIẾN MẺ & CÂN THÀNH PHẨM (SPLIT-VIEW PC - TASK-PC-06) */}
      {/* ============================================================== */}
      {activeModal === 'batch' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg lg:max-w-5xl xl:max-w-6xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
                <Flame className="h-6 w-6" />
                <span>NÚT 2: CHẾ BIẾN MẺ & CÂN HAO HỤT THÀNH PHẨM</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                title="Đóng (Phím Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab Chọn: Mở mẻ mới HOẶC Cân thành phẩm */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mt-4">
              <button
                onClick={() => setBatchTab('start')}
                className={`btn-touch py-2 rounded-lg text-xs font-bold transition-all ${
                  batchTab === 'start' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Mở Mẻ Mới
              </button>
              <button
                onClick={() => setBatchTab('finish')}
                className={`btn-touch py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  batchTab === 'finish' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Scale className="h-3.5 w-3.5" />
                <span>2. Cân Thành Phẩm ({activeBatches.length})</span>
              </button>
            </div>

            {/* TAB 1: MỞ MẺ MỚI (SPLIT-VIEW 2 CỘT TRÊN PC) */}
            {batchTab === 'start' && (
              <div className="lg:grid lg:grid-cols-12 lg:gap-6 mt-4">
                {/* Cột trái (60%): Form nhập liệu */}
                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">MÓN CHẾ BIẾN</label>
                    <select
                      value={batchItemId}
                      onChange={(e) => setBatchItemId(Number(e.target.value))}
                      className="w-full h-12 px-3 rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    >
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.itemName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">KHỐI LƯỢNG NGUYÊN LIỆU ĐẦU VÀO (KG)</label>
                      <span className="text-xs font-semibold text-emerald-600">
                        Đang nhập: <strong className="text-base text-slate-900 font-mono">{batchInputWeight}</strong> kg
                      </span>
                    </div>
                    <VirtualNumpad
                      value={batchInputWeight}
                      onChange={(val) => setBatchInputWeight(val)}
                      unit="kg"
                      quickAddValues={[1, 5, 10]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">GHI CHÚ MẺ</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Cua hấp bia sả ca trưa..."
                      value={batchNote}
                      onChange={(e) => setBatchNote(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                    >
                    </input>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => handleStartBatchSubmit(false)}
                      disabled={isStartingBatch}
                      className="btn-touch w-full h-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                    >
                      {isStartingBatch ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Flame className="h-5 w-5" />
                          <span>BẮT ĐẦU CHẾ BIẾN MẺ</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Cột phải (40%): Định mức & Quy định an toàn bếp */}
                <div className="hidden lg:flex lg:col-span-5 flex-col space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm border-b border-slate-200 pb-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Định Mức Hao Hụt Tiêu Chuẩn Chuỗi</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">🦀 Cua thịt Cà Mau / Cua gạch:</span>
                      <span className="font-mono font-bold text-emerald-700">&le; 3.8%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">🦀 Ghẹ xanh Nghệ An / Ghẹ tươi:</span>
                      <span className="font-mono font-bold text-emerald-700">&le; 4.2%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">🦐 Bề bề, Tôm thẻ, Mực trứng:</span>
                      <span className="font-mono font-bold text-emerald-700">&le; 5.0%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">🥩 Ba chỉ bò Mỹ, Dẻ sườn nướng:</span>
                      <span className="font-mono font-bold text-emerald-700">&le; 6.5%</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1">
                    <span className="font-bold flex items-center gap-1 text-amber-800">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      Quy Tắc Vận Hành Chống Thất Thoát
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      1. Cân khối lượng đầu vào trước khi mở mẻ.<br/>
                      2. Hoàn thành mẻ bắt buộc cân thành phẩm ngay trước khi mở mẻ mới.<br/>
                      3. Bắt buộc chụp ảnh mặt bàn cân hiển thị rõ số kg.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CÂN THÀNH PHẨM (SPLIT-VIEW 2 CỘT TRÊN PC) */}
            {batchTab === 'finish' && (
              <div>
                {activeBatches.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">Hiện không có mẻ nào đang làm dở dang</p>
                    <button
                      onClick={() => setBatchTab('start')}
                      className="mt-3 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold"
                    >
                      Mở mẻ chế biến mới
                    </button>
                  </div>
                ) : (
                  <div className="lg:grid lg:grid-cols-12 lg:gap-6 mt-4">
                    {/* Cột trái (60%): Chọn mẻ & nhập khối lượng thành phẩm */}
                    <div className="lg:col-span-7 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">CHỌN MẺ CẦN CÂN THÀNH PHẨM</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {activeBatches.map((b) => (
                            <div
                              key={b.id}
                              onClick={() => {
                                setSelectedFinishBatch(b);
                                setFinishScalePhoto(null);
                                const savedDraft = localStorage.getItem(`senviet_offline_finish_batch_${b.id}`);
                                if (savedDraft) {
                                  try {
                                    const parsed = JSON.parse(savedDraft);
                                    if (parsed.weight) setFinishOutputWeight(parsed.weight);
                                    if (parsed.photo) setFinishScalePhoto(parsed.photo);
                                    showNotice('success', `Đã khôi phục số cân lưu tạm: ${parsed.weight} kg kèm ảnh`);
                                  } catch {
                                    setFinishOutputWeight(parseFloat(savedDraft) || 0);
                                    showNotice('success', `Đã khôi phục số cân lưu tạm: ${savedDraft} kg`);
                                  }
                                } else {
                                  setFinishOutputWeight(0);
                                }
                              }}
                              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                selectedFinishBatch?.id === b.id
                                  ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-slate-800">{b.itemName}</span>
                                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                  {b.batchCode}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                                <span>Khối lượng đầu vào: <strong className="text-slate-800">{b.inputWeight} kg</strong></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedFinishBatch && (
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-bold text-slate-700">KHỐI LƯỢNG THÀNH PHẨM CÂN ĐƯỢC (KG)</label>
                              <span className="text-xs text-slate-500">
                                Đang cân: <strong className="text-base text-slate-900 font-mono">{finishOutputWeight}</strong> / {selectedFinishBatch.inputWeight} kg
                              </span>
                            </div>
                            <VirtualNumpad
                              value={finishOutputWeight}
                              onChange={(val) => setFinishOutputWeight(val)}
                              unit="kg"
                              quickAddValues={[1, 5, 10]}
                              max={selectedFinishBatch.inputWeight}
                            />
                          </div>

                          {/* Phân tích hao hụt realtime */}
                          {finishOutputWeight > 0 && selectedFinishBatch.inputWeight && (
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                              <div>
                                <span className="text-slate-500 block">Tỷ lệ hao hụt thực tế:</span>
                                <span className="font-mono font-black text-sm text-slate-900">
                                  {(((selectedFinishBatch.inputWeight - finishOutputWeight) / selectedFinishBatch.inputWeight) * 100).toFixed(1)}%
                                </span>
                                <span className="text-slate-400 ml-1">
                                  (-{(selectedFinishBatch.inputWeight - finishOutputWeight).toFixed(2)} kg)
                                </span>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                ((selectedFinishBatch.inputWeight - finishOutputWeight) / selectedFinishBatch.inputWeight) * 100 <= 5.0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {((selectedFinishBatch.inputWeight - finishOutputWeight) / selectedFinishBatch.inputWeight) * 100 <= 5.0
                                  ? '✓ Trong định mức'
                                  : '⚠️ Vượt định mức'}
                              </span>
                            </div>
                          )}

                          <button
                            onClick={handleFinishBatchSubmit}
                            disabled={isFinishingBatch || finishOutputWeight <= 0 || !finishScalePhoto}
                            className="btn-touch w-full h-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                          >
                            {isFinishingBatch ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <>
                                <Scale className="h-5 w-5" />
                                <span>XÁC NHẬN HOÀN TẤT CÂN MẺ</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Cột phải (40%): Khung chụp ảnh mặt bàn cân điện tử cỡ lớn */}
                    <div className="lg:col-span-5 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-emerald-600" />
                          <span>ẢNH BÀN CÂN ĐIỆN TỬ</span>
                          <span className="text-rose-600 font-black">(*)</span>
                        </label>
                        <span className="text-[11px] font-bold text-slate-400">Chống gian lận</span>
                      </div>

                      <input
                        ref={finishScalePhotoInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFinishScalePhotoUpload}
                        className="hidden"
                      />

                      {finishScalePhoto ? (
                        <div className="space-y-2">
                          <div className="relative rounded-xl overflow-hidden border border-emerald-400 bg-slate-950 aspect-video max-h-64 flex items-center justify-center group">
                            <img
                              src={finishScalePhoto}
                              alt="Mặt bàn cân điện tử"
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewScalePhoto(finishScalePhoto)}
                                className="p-2 rounded-lg bg-white/90 text-slate-800 text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                              >
                                <ZoomIn className="w-4 h-4" /> Soi cận cảnh
                              </button>
                              <button
                                type="button"
                                onClick={() => finishScalePhotoInputRef.current?.click()}
                                className="p-2 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                              >
                                <Camera className="w-4 h-4" /> Chụp lại
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Đã có Watermark xác thực
                            </span>
                            <button
                              type="button"
                              onClick={() => setFinishScalePhoto(null)}
                              className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                            >
                              Xóa ảnh
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          {isCompressingScalePhoto ? (
                            <div className="flex flex-col items-center justify-center gap-2 text-emerald-700 py-4">
                              <Loader2 className="w-6 h-6 animate-spin" />
                              <span className="text-xs font-bold">Đang nén ảnh & đóng dấu Watermark...</span>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <button
                                type="button"
                                onClick={() => finishScalePhotoInputRef.current?.click()}
                                className="w-full py-6 px-4 rounded-xl bg-white hover:bg-emerald-50 border-2 border-dashed border-emerald-500 text-emerald-700 font-bold text-sm flex flex-col items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                              >
                                <Camera className="w-8 h-8 text-emerald-600" />
                                <span>CHỤP ẢNH MẶT BÀN CÂN ĐIỆN TỬ (*)</span>
                                <span className="text-xs font-normal text-slate-500">Hiển thị rõ số kg LCD</span>
                              </button>
                              <p className="text-[11px] text-rose-600 font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-200 text-left">
                                ⚠️ BẮT BUỘC chụp ảnh mặt bàn cân điện tử hiển thị rõ số kg thành phẩm để chống gian lận!
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Zoom Cận Cảnh Ảnh Bàn Cân (TASK-WH-04) */}
      {previewScalePhoto && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setPreviewScalePhoto(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl p-5 border border-slate-700 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 text-white">
              <span className="font-bold text-sm flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                Ảnh Mặt Bàn Cân Điện Tử ({selectedFinishBatch?.batchCode})
              </span>
              <button
                onClick={() => setPreviewScalePhoto(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-center bg-black rounded-2xl overflow-hidden max-h-[70vh]">
              <img
                src={previewScalePhoto}
                alt="Mặt bàn cân điện tử"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Định lượng ghi nhận: <strong className="text-emerald-400 font-mono text-sm">{finishOutputWeight} kg</strong></span>
              <button
                onClick={() => setPreviewScalePhoto(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* POPUP CẢNH BÁO ĐỎ MẺ THỨ HAI (SECOND BATCH WARNING MODAL)      */}
      {/* ============================================================== */}
      {showSecondBatchWarning && pendingBatchRequest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-rose-500 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-3 rounded-2xl bg-rose-100">
                <AlertTriangle className="h-8 w-8 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-rose-700">CẢNH BÁO MẺ CHẾ BIẾN THỨ HAI!</h3>
                <p className="text-xs text-slate-500">Quy tắc chống thất thoát bếp</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed bg-rose-50 p-3.5 rounded-xl border border-rose-200">
              Món này đang có một mẻ chế biến <strong>chưa hoàn tất cân thành phẩm</strong>.
              Bạn có chắc chắn muốn mở thêm mẻ mới trước khi hoàn thành mẻ cũ?
            </p>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                onClick={() => {
                  setShowSecondBatchWarning(false);
                  setPendingBatchRequest(null);
                }}
                className="btn-touch h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
              >
                HỦY BỎ
              </button>
              <button
                type="button"
                onClick={() => handleStartBatchSubmit(true)}
                disabled={isStartingBatch}
                className="btn-touch h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5"
              >
                {isStartingBatch ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>VẪN MỞ MẺ MỚI</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* GIAI ĐOẠN 8: POPUP CHẶN CỨNG BÁO HỎNG CHỜ DUYỆT (HTTP 422)    */}
      {/* ============================================================== */}
      {showUnapprovedDamageModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-rose-600 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-3 rounded-2xl bg-rose-100">
                <ShieldAlert className="h-8 w-8 text-rose-600" />
              </div>
              <div>
                <h3 className="font-black text-base text-rose-700">CHẶN CỨNG: BÁO HỎNG CHỜ DUYỆT!</h3>
                <p className="text-xs text-slate-500 font-semibold">Quy tắc chống thất thoát bếp (Phase 8)</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs sm:text-sm leading-relaxed space-y-2">
              <p className="font-bold text-rose-800">
                {unapprovedDamageError ||
                  'Món này đang có mẻ/lô báo hỏng chờ Quản lý duyệt. Vui lòng liên hệ Quản lý phê duyệt trước khi mở mẻ mới!'}
              </p>
              <p className="text-slate-600 text-xs leading-normal">
                Để xóa bỏ hoàn toàn việc mở mẻ mới nhằm che giấu hao hụt/hỏng hóc mẻ trước, hệ thống
                <strong> chặn tuyệt đối</strong> thao tác bắt đầu mẻ mới cho đến khi Quản lý Chi nhánh phê duyệt
                đơn báo hỏng trước đó.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowUnapprovedDamageModal(false)}
                className="btn-touch w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5"
              >
                <span>ĐÃ HIỂU & LIÊN HỆ QUẢN LÝ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: RA LINE (+1 ĐĨA)                                      */}
      {/* ============================================================== */}
      {activeModal === 'lineItem' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-base">
                <PlusCircle className="h-6 w-6" />
                <span>NÚT 3: BẤM RA LINE BUFFET (+1)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Thêm món nhanh</span>
                </button>
                <button onClick={() => setActiveModal(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* TASK-FLOW-04 Business Rule Callout */}
            <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Khẳng định nghiệp vụ (TASK-FLOW-04):</strong> Món ra line lấy từ <strong>KHO SAU CHẾ BIẾN</strong>. Mỗi lần bấm <strong>+1 ĐĨA</strong>, hệ thống khấu trừ trực tiếp tồn kho món ăn hoàn chỉnh. Nếu kho hết hàng, hệ thống cảnh báo yêu cầu làm mẻ mới tại <strong>Nút 2</strong>.
              </span>
            </div>

            {/* Thanh tìm kiếm & lọc Station */}
            <div className="space-y-2 mt-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm món ra line..."
                  value={lineSearchTerm}
                  onChange={(e) => setLineSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Station Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'BEP_NONG', label: 'Bếp Nóng' },
                  { key: 'BEP_LANH', label: 'Bếp Lạnh' },
                  { key: 'BAR', label: 'Bar' },
                  { key: 'RA_LINE', label: 'Line Buffet' },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setSelectedStation(st.key as KitchenStation)}
                    className={`btn-touch px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedStation === st.key
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Mỗi lần nhấn nút <strong className="text-amber-700">+1 ĐĨA / KHAY</strong>, hệ thống tự động ghi nhận đĩa đưa ra line và loại bỏ hoàn toàn hiện tượng bấm đúp (chống double-click).
            </p>

            <div className="space-y-3 mt-4">
              {(processedDishes.length > 0 ? processedDishes : (items as any[]))
                .filter((it: any) => {
                  const name = it.dishName || it.itemName || '';
                  const code = it.dishCode || it.itemCode || '';
                  return (
                    name.toLowerCase().includes(lineSearchTerm.toLowerCase()) ||
                    code.toLowerCase().includes(lineSearchTerm.toLowerCase())
                  );
                })
                .map((item: any) => {
                  const isDish = 'dishCode' in item;
                  const itemId = item.id;
                  const isLoadingBtn = !!loadingLineButtons[itemId];
                  const isCooldown = !!cooldownButtons[itemId];
                  const isLocked = isLoadingBtn || isCooldown;
                  const countToday = lineCounters[itemId] || 0;
                  const isAnimating = animatingLineItemId === itemId;
                  const isShaking = shakingLineItemId === itemId;
                  const currentStock = isDish ? (item.quantity ?? 0) : 10;
                  const isOutOfStock = currentStock <= 0;
                  const name = item.dishName || item.itemName;
                  const unit = item.unit || 'đĩa';
                  const category = item.category || 'Món Nóng';

                  return (
                    <div
                      key={itemId}
                      className={`relative p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-3 overflow-hidden transition-all ${
                        isShaking ? 'ring-2 ring-amber-400 animate-haptic-shake' : ''
                      }`}
                    >
                      {/* Floating +1 pop badge animation */}
                      {isAnimating && (
                        <div className="absolute top-2 right-4 px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-xs shadow-xl animate-float-up flex items-center gap-1 z-20 pointer-events-none">
                          <Check className="h-3.5 w-3.5" />
                          <span>+1 {unit}!</span>
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm sm:text-base text-slate-900 truncate">{name}</div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold text-slate-600">Tồn kho sau chế biến:</span>
                          <span
                            className={`font-mono font-black ${
                              isOutOfStock
                                ? 'text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200'
                                : 'text-emerald-700'
                            }`}
                          >
                            {currentStock} {unit}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>Đã ra line:</span>
                          <span
                            className={`font-mono font-black transition-all ${
                              isAnimating ? 'text-emerald-600 scale-125' : 'text-amber-700'
                            }`}
                          >
                            {countToday}
                          </span>
                          <span>{unit}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1 font-semibold">
                            {category}
                          </span>
                        </div>
                        {isOutOfStock && (
                          <div className="text-[10px] font-bold text-rose-700 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Hết món trong kho sau chế biến! Cần làm mẻ tại Nút 2.</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleLineItemInc(item)}
                        disabled={isLocked || isOutOfStock}
                        className={`btn-touch px-4 h-12 rounded-xl text-white font-extrabold text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-all flex-shrink-0 ${
                          isOutOfStock
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                            : isLocked
                            ? 'bg-amber-300 cursor-not-allowed opacity-80'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20'
                        }`}
                      >
                        {isLoadingBtn ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>ĐANG GHI...</span>
                          </>
                        ) : isCooldown ? (
                          <>
                            <Clock className="h-4 w-4 animate-pulse" />
                            <span>CHỜ 1.5s</span>
                          </>
                        ) : isOutOfStock ? (
                          <span>HẾT KHO</span>
                        ) : (
                          <>
                            <PlusCircle className="h-5 w-5" />
                            <span>+1 {unit}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: BÁO HỎNG NGUYÊN LIỆU (SPLIT-VIEW PC - TASK-PC-06)      */}
      {/* ============================================================== */}
      {activeModal === 'damage' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg lg:max-w-5xl xl:max-w-6xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <AlertTriangle className="h-6 w-6" />
                <span>NÚT 4: BÁO HỎNG NGUYÊN LIỆU & BẮT ĐỀN NCC</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                title="Đóng (Phím Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDamageSubmit} className="lg:grid lg:grid-cols-12 lg:gap-6 mt-4 space-y-4 lg:space-y-0">
              {/* CỘT TRÁI (60% ~ 7/12 CỘT): FORM NHẬP LIỆU */}
              <div className="lg:col-span-7 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">NGUYÊN LIỆU BÁO HỎNG</label>
                  <select
                    value={damageItemId}
                    onChange={(e) => setDamageItemId(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-medium text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500"
                  >
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.itemName} ({Number(i.costPrice).toLocaleString('vi-VN')} đ/{i.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">SỐ LƯỢNG HỎNG</label>
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      placeholder="Nhập số lượng..."
                      value={damageQty}
                      onChange={(e) => {
                        const val = e.target.value.replace(',', '.');
                        setDamageQty(parseFloat(val) || 0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === ',') {
                          e.preventDefault();
                          const cur = String(damageQty ?? '');
                          if (!cur.includes('.')) {
                            setDamageQty(((cur ? cur : '0') + '.') as any);
                          }
                        }
                      }}
                      className="w-full h-11 px-3 rounded-xl border border-slate-300 font-extrabold text-base text-slate-900 focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">PHÂN LOẠI LÝ DO HỦY</label>
                    <select
                      value={damageReason}
                      onChange={(e) => setDamageReason(e.target.value)}
                      className="w-full h-11 px-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500"
                    >
                      <optgroup label="1. Hủy do sơ chế / nấu hỏng">
                        <option value="HONG_SO_CHE_NAU">Hủy do sơ chế / nấu hỏng</option>
                        <option value="HONG_CHE_BIEN">Lỗi thao tác chế biến của đầu bếp</option>
                      </optgroup>
                      <optgroup label="2. Hủy do nguyên liệu chết / ươn từ NCC">
                        <option value="HONG_DO_NHA_CUNG_CAP">Hủy do hàng chết / ươn từ NCC</option>
                        <option value="HONG_BAO_QUAN">Hư hỏng thiết bị lạnh / tủ cấp đông</option>
                      </optgroup>
                      <optgroup label="3. Hủy do thừa cuối ca">
                        <option value="HUY_THUA_CUOI_CA">Hủy thừa cuối ca (chuẩn VSATTP)</option>
                        <option value="HET_HAN_SU_DUNG">Hết hạn sử dụng trong ngày</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* CHỌN LÔ HÀNG (BATCH/LOT) ĐỂ TRUY VẾT NCC & CUA CHẾT */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    LÔ HÀNG LIÊN KẾT (TRUY VẾT LÔ NHẬP & NCC)
                  </label>
                  {availableBatches.length > 0 ? (
                    <select
                      value={selectedBatchCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setSelectedBatchCode(code);
                        const found = availableBatches.find((b) => b.batchCode === code);
                        if (found && (found.supplierCode || found.supplierName)) {
                          setDamageSupplier(found.supplierCode || found.supplierName || '');
                        }
                      }}
                      className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">-- Chọn lô nhập để truy vết chính xác NCC --</option>
                      {availableBatches.map((b) => (
                        <option key={b.id} value={b.batchCode}>
                          {b.batchCode} ({b.supplierName || b.supplierCode || 'NCC'} - Tồn: {b.currentStock} {b.unit})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Mã lô (VD: LOT-202611-001) hoặc để trống..."
                      value={selectedBatchCode}
                      onChange={(e) => setSelectedBatchCode(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-rose-500"
                    />
                  )}
                </div>

                {damageReason === 'HONG_DO_NHA_CUNG_CAP' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">MÃ / TÊN NHÀ CUNG CẤP</label>
                    <input
                      type="text"
                      value={damageSupplier}
                      onChange={(e) => setDamageSupplier(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingDamage}
                    className="btn-touch w-full h-13 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    {isSubmittingDamage ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        <span>GỬI ĐƠN BÁO HỎNG (Ctrl + S)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* CỘT PHẢI (40% ~ 5/12 CỘT): ẢNH MINH CHỨNG & TÓM TẮT THIỆT HẠI */}
              <div className="lg:col-span-5 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-rose-600" />
                      <span>ẢNH MINH CHỨNG HỎNG</span>
                      <span className="text-rose-600 font-black">(*)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Nén &lt; 250KB</span>
                  </div>

                  {/* Input ẩn chụp ảnh */}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    ref={galleryInputRef}
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />

                  {damageImage ? (
                    <div className="space-y-2">
                      <div className="relative rounded-xl overflow-hidden border border-rose-300 bg-slate-950 aspect-video max-h-56 flex items-center justify-center">
                        <img
                          src={damageImage.dataUrl}
                          alt="Ảnh minh chứng báo hỏng"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Đã nén: {damageImage.compressedSizeKb} KB</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDamageImage(null)}
                          className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                        >
                          Xóa & Chụp lại
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isCompressing}
                          className="btn-touch h-16 rounded-xl border-2 border-dashed border-rose-300 hover:border-rose-500 bg-white text-rose-800 flex flex-col items-center justify-center gap-1 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          <Camera className="h-5 w-5 text-rose-600" />
                          <span>Chụp Ảnh Ngay</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          disabled={isCompressing}
                          className="btn-touch h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-500 bg-white text-slate-700 flex flex-col items-center justify-center gap-1 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          <ImageIcon className="h-5 w-5 text-slate-500" />
                          <span>Từ Thư Viện</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 italic text-center">
                        Chụp cận cảnh thực phẩm hỏng, ươn chết để làm căn cứ trừ tiền NCC.
                      </p>
                    </div>
                  )}
                </div>

                {/* Card dự toán thiệt hại tiền mặt */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Ước tính thiệt hại:</span>
                      <div className="font-mono font-black text-base text-rose-700">
                        {estimatedDamageCost.toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                    <div>
                      {isAutoApprove ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Tự động (&le;500k)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Quản lý duyệt (&gt;500k)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 bg-white/60 p-2 rounded-lg border border-slate-100 leading-relaxed">
                    💡 <strong>Quy trình xử lý:</strong> Đơn báo hỏng được gửi tức thời đến Bếp trưởng & Quản lý cơ sở để duyệt trừ công nợ NCC hoặc ghi nhận hao hụt ca.
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: TẠO ĐỒ ĂN THỪA CUỐI CA (BẮT BUỘC ẢNH CHỤP ĐÍNH KÈM)    */}
      {/* ============================================================== */}
      {activeModal === 'leftoverWaste' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-purple-700 font-black text-base">
                <Trash2 className="h-6 w-6 text-purple-600" />
                <span>NÚT 5: TẠO ĐỒ ĂN THỪA CUỐI CA</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleLeftoverWasteSubmit} className="space-y-4 mt-4">
              {/* Business Rule Callout */}
              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs leading-relaxed space-y-1">
                <p className="font-bold text-purple-800 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>Quy Chuẩn Chống Thất Thoát & Kiểm Soát Cuối Ca (TASK-FLOW-05):</span>
                </p>
                <p className="text-purple-900/90 text-xs">
                  Ghi nhận số lượng thức ăn dư thừa trên line buffet hoặc trong bếp cuối ca để hạch toán vào <strong>"Hỏng/bỏ có báo"</strong> của Bảng đối soát cuối ngày.
                  <strong> BẮT BUỘC chụp ảnh mặt bàn cân / khay thức ăn thừa</strong> để chống thất thoát.
                </p>
              </div>

              {/* Phân loại vị trí thức ăn thừa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  VỊ TRÍ THỨC ĂN THỪA
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLeftoverLocation('LINE')}
                    className={`btn-touch py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      leftoverLocation === 'LINE'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Utensils className="h-4 w-4" />
                    <span>Trên Line Buffet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeftoverLocation('BEP')}
                    className={`btn-touch py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      leftoverLocation === 'BEP'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Flame className="h-4 w-4" />
                    <span>Trong Kho Bếp</span>
                  </button>
                </div>
              </div>

              {/* Chọn món ăn thừa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                  MÓN ĂN DƯ THỪA
                </label>
                <select
                  value={leftoverDishId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setLeftoverDishId(id);
                    const d = processedDishes.find((dish) => dish.id === id);
                    if (d) {
                      setLeftoverItemName(d.dishName);
                      setLeftoverUnit(d.unit || 'đĩa');
                    }
                  }}
                  className="w-full h-12 px-3 rounded-xl border border-slate-300 font-bold text-slate-800 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  {processedDishes.map((dish) => (
                    <option key={dish.id} value={dish.id}>
                      {dish.dishName} ({dish.unit}) - [Kho Sau: {dish.quantity} {dish.unit}]
                    </option>
                  ))}
                  {items.map((i) => (
                    <option key={`item-${i.id}`} value={i.id}>
                      {i.itemName} ({i.unit}) - [Nguyên liệu]
                    </option>
                  ))}
                </select>
              </div>

              {/* Số lượng thừa & Đơn vị tính */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    SỐ LƯỢNG THỪA
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    placeholder="Nhập số lượng..."
                    value={leftoverQty}
                    onChange={(e) => {
                      const val = e.target.value.replace(',', '.');
                      setLeftoverQty(val === '' ? '' : parseFloat(val) || 0);
                    }}
                    className="w-full h-12 px-3 rounded-xl border border-slate-300 font-black text-lg text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    ĐƠN VỊ TÍNH
                  </label>
                  <select
                    value={leftoverUnit}
                    onChange={(e) => setLeftoverUnit(e.target.value)}
                    className="w-full h-12 px-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 text-sm focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="đĩa">Đĩa</option>
                    <option value="kg">kg</option>
                    <option value="khay">Khay</option>
                    <option value="bát">Bát</option>
                  </select>
                </div>
              </div>

              {/* Lý do thức ăn thừa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                  LÝ DO DƯ THỪA
                </label>
                <select
                  value={leftoverReason}
                  onChange={(e) => setLeftoverReason(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 text-slate-800 font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Khách dùng không hết">Khách dùng không hết (thừa trên quầy buffet)</option>
                  <option value="Quá thời gian trưng bày theo chuẩn ATTP">Quá thời gian trưng bày theo chuẩn ATTP</option>
                  <option value="Sơ chế / Nấu dư thừa trong ca">Sơ chế / Nấu dư thừa trong ca</option>
                  <option value="Món ăn bị nguội hoặc hỏng chất lượng">Món ăn bị nguội hoặc hỏng chất lượng</option>
                  <option value="Khác">Lý do khác...</option>
                </select>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                  GHI CHÚ THÊM (TÙY CHỌN)
                </label>
                <input
                  type="text"
                  placeholder="Ghi chú thêm về món ăn thừa..."
                  value={leftoverNote}
                  onChange={(e) => setLeftoverNote(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* KHU VỰC BẮT BUỘC CHỤP ẢNH BÀN CÂN / THỨC ĂN THỪA */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-rose-700 uppercase flex items-center gap-1">
                    <Camera className="h-4 w-4 text-rose-600" />
                    <span>ẢNH CHỤP MẶT BÀN CÂN / THỨC ĂN THỪA (BẮT BUỘC)</span>
                  </label>
                  {leftoverPhoto && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Đã nén: {Math.round(leftoverPhoto.compressedSizeKb)}KB
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={leftoverPhotoInputRef}
                  onChange={handleLeftoverPhotoUpload}
                  className="hidden"
                />

                {!leftoverPhoto ? (
                  <div
                    onClick={() => leftoverPhotoInputRef.current?.click()}
                    className="p-6 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/60 hover:bg-rose-50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    {isCompressingLeftoverPhoto ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        <span className="text-xs font-bold text-purple-800">Đang nén ảnh Canvas API & chèn Watermark...</span>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 rounded-full bg-rose-100 text-rose-600 shadow-xs">
                          <Camera className="h-7 w-7" />
                        </div>
                        <div className="text-center">
                          <p className="font-black text-rose-800 text-xs sm:text-sm">
                            BẤM ĐỂ CHỤP ẢNH BÀN CÂN / KHAY THỨC ĂN THỪA
                          </p>
                          <p className="text-[11px] text-rose-600 mt-0.5">
                            Camera điện thoại / máy tính bảng • Tự động nén &lt; 200KB kèm Watermark
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-purple-200 bg-purple-50/40 p-2 flex items-center gap-3">
                    <img
                      src={leftoverPhoto.dataUrl}
                      alt="Ảnh thức ăn thừa"
                      className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-xs"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="text-xs font-bold text-purple-900 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Đã có ảnh minh chứng hợp lệ</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Độ phân giải: {leftoverPhoto.width}x{leftoverPhoto.height}px
                      </div>
                      <button
                        type="button"
                        onClick={() => leftoverPhotoInputRef.current?.click()}
                        className="text-xs font-bold text-purple-700 hover:text-purple-900 underline flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        <span>Chụp lại ảnh khác</span>
                      </button>
                    </div>
                  </div>
                )}

                {!leftoverPhoto && (
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs font-semibold text-amber-900">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Hệ thống sẽ khóa nút xác nhận nếu chưa có ảnh chụp đính kèm.</span>
                  </div>
                )}
              </div>

              {/* Nút xác nhận lưu */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingLeftover || !leftoverPhoto || !leftoverQty || Number(leftoverQty) <= 0}
                  className="btn-touch w-full h-14 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:text-slate-500 disabled:shadow-none text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  {isSubmittingLeftover ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      <span>XÁC NHẬN GHI NHẬN ĐỒ ĂN THỪA</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* GIAI ĐOẠN 8: MODAL XÁC NHẬN GHI BỎ MÓN DÙNG TRONG NGÀY         */}
      {/* ============================================================== */}
      {showDailyWasteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700 font-black text-base">
                <Salad className="h-6 w-6 text-emerald-600" />
                <span>XÁC NHẬN GHI BỎ MÓN DÙNG TRONG NGÀY (CUỐI CA)</span>
              </div>
              <button
                onClick={() => setShowDailyWasteModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDailyWaste} className="space-y-4 mt-4">
              {/* Business Rule Explanation */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs leading-relaxed space-y-1">
                <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Quy Chuẩn ATTP & Chống Thất Thoát (Task 8.3):</span>
                </p>
                <p className="text-emerald-900/90 text-xs">
                  Món tươi sống chỉ dùng trong ngày (salad, nộm, kim chi, bánh bao...) không được lưu cữu qua đêm.
                  Số lượng ghi bỏ này được hạch toán vào cột <strong>"Hỏng/bỏ có báo"</strong> của Bảng cuối ngày
                  và <strong>KHÔNG phạt tiền nhân viên</strong>.
                </p>
              </div>

              {/* Shift & Date Controls */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">CA GHI BỎ</label>
                  <select
                    value={dailyWasteShift}
                    onChange={(e) => setDailyWasteShift(e.target.value as 'CA_TOI' | 'CA_SANG')}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-bold text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="CA_TOI">🌙 Ca Tối (Cuối ngày / Đóng ca)</option>
                    <option value="CA_SANG">🌅 Ca Sáng (Chuyển giao trưa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">NGÀY XỬ LÝ</label>
                  <input
                    type="date"
                    value={dailyWasteDate}
                    onChange={(e) => setDailyWasteDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">GHI CHÚ CHUNG</label>
                <input
                  type="text"
                  placeholder="Ghi bỏ salad và nộm cuối ngày..."
                  value={dailyWasteGeneralNote}
                  onChange={(e) => setDailyWasteGeneralNote(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Danh Sách Món Tươi Chỉ Dùng Trong Ngày ({dailyItems.length})
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Nhập số lượng đĩa / kg ghi bỏ thực tế
                  </span>
                </div>

                {isLoadingDailyItems ? (
                  <div className="p-8 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    <span className="text-xs">Đang quét danh sách món chỉ dùng trong ngày...</span>
                  </div>
                ) : dailyItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Salad className="h-8 w-8 mx-auto text-slate-300 mb-1" />
                    <p className="text-xs font-semibold">Chưa có món nào được đánh dấu là "Chỉ dùng trong ngày"</p>
                    <p className="text-[11px] mt-0.5">
                      Bấm "+ Thêm món nhanh" trên màn hình Ra Line và tích chọn "Món chỉ dùng trong ngày".
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 font-bold text-slate-600 sticky top-0">
                        <tr>
                          <th className="p-2.5">Món ăn</th>
                          <th className="p-2.5">Tồn hiện tại</th>
                          <th className="p-2.5">Số lượng ghi bỏ</th>
                          <th className="p-2.5">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dailyItems.map((it) => (
                          <tr key={it.id} className="hover:bg-slate-50">
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{it.itemName}</div>
                              <span className="text-[10px] text-slate-500">{it.category}</span>
                            </td>
                            <td className="p-2.5 font-mono text-slate-700 font-semibold">
                              {it.remainingStock ?? 0} {it.unit}
                            </td>
                            <td className="p-2.5">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={dailyWasteQuantities[it.id] ?? 0}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(',', '.');
                                    setDailyWasteQuantities({
                                      ...dailyWasteQuantities,
                                      [it.id]: parseFloat(val) || 0,
                                    });
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === ',') {
                                      e.preventDefault();
                                      const cur = String(dailyWasteQuantities[it.id] ?? '');
                                      if (!cur.includes('.')) {
                                        setDailyWasteQuantities({
                                          ...dailyWasteQuantities,
                                          [it.id]: ((cur ? cur : '0') + '.') as any,
                                        });
                                      }
                                    }
                                  }}
                                  className="w-20 h-9 px-2 rounded-lg border border-slate-300 font-mono font-extrabold text-sm focus:ring-2 focus:ring-emerald-500"
                                />
                                <span className="text-xs font-bold text-slate-600">{it.unit}</span>
                              </div>
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                placeholder="Lý do hủy..."
                                value={dailyWasteItemNotes[it.id] || ''}
                                onChange={(e) =>
                                  setDailyWasteItemNotes({
                                    ...dailyWasteItemNotes,
                                    [it.id]: e.target.value,
                                  })
                                }
                                className="w-full h-8 px-2 rounded border border-slate-200 text-xs"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDailyWasteModal(false)}
                  className="btn-touch h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDailyWaste || dailyItems.length === 0}
                  className="btn-touch h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                >
                  {isSubmittingDailyWaste ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>ĐANG XÁC NHẬN...</span>
                    </>
                  ) : (
                    <span>XÁC NHẬN GHI BỎ CUỐI CA</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* GIAI ĐOẠN 8: MODAL THÊM MÓN NHANH TRỰC TIẾP RA LINE            */}
      {/* ============================================================== */}
      {showQuickAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600 font-black text-base">
                <Plus className="h-6 w-6" />
                <span>THÊM NHANH MÓN RA LINE BUFFET</span>
              </div>
              <button
                onClick={() => setShowQuickAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddLineItem} className="space-y-4 mt-4">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                Thêm món mới ngay tại quầy bếp để bấm nút ra line (+1) mà không cần vào menu cấu hình của Quản trị viên.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">TÊN MÓN ĂN MỚI *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nộm hoa chuối tai heo, Bánh bao chiên..."
                  value={quickItemName}
                  onChange={(e) => setQuickItemName(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">NHÓM MÓN</label>
                  <select
                    value={quickItemCategory}
                    onChange={(e) => setQuickItemCategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="MÓN KHAI VỊ / SALAD">Khai vị / Salad</option>
                    <option value="MÓN NẤU / RA LINE">Món nấu / Ra line</option>
                    <option value="MÓN NƯỚNG">Món nướng</option>
                    <option value="HẢI SẢN">Hải sản</option>
                    <option value="TRÁNG MIỆNG">Tráng miệng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">ĐƠN VỊ TÍNH</label>
                  <select
                    value={quickItemUnit}
                    onChange={(e) => setQuickItemUnit(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Đĩa">Đĩa</option>
                    <option value="Khay">Khay</option>
                    <option value="Nồi">Nồi</option>
                    <option value="Tô">Tô</option>
                    <option value="Bát">Bát</option>
                    <option value="Suất">Suất</option>
                    <option value="con">Con</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">GIÁ VỐN ƯỚC TÍNH (Đ)</label>
                <input
                  type="number"
                  step="5000"
                  min="0"
                  value={quickItemCostPrice}
                  onChange={(e) => setQuickItemCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Checkbox is_daily_only */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chk-daily-only"
                  checked={quickIsDailyOnly}
                  onChange={(e) => setQuickIsDailyOnly(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="chk-daily-only" className="text-xs text-slate-700 font-medium cursor-pointer">
                  <strong className="block font-bold text-emerald-800">Món tươi chỉ dùng trong ngày</strong>
                  Tự động đưa vào danh sách kiểm đếm hủy bỏ cuối ca (salad, nộm, rau củ...).
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="btn-touch h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuickAdd}
                  className="btn-touch h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  {isSubmittingQuickAdd ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>THÊM VÀO MENU LINE</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* KHO-13: MODAL CÂN HÀNG MỚI VỀ (BẾP NHẬN HÀNG NCC TRỰC TIẾP)   */}
      {/* ============================================================== */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-100 text-orange-700">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 uppercase">Cân Hàng Mới Về (Bếp Nhận)</h3>
                  <p className="text-[11px] text-slate-500">
                    Bếp cân thực tế & chụp ảnh bàn cân. Không hiển thị giá tiền.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiveModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReceiveWeight} className="space-y-3.5 mt-4 text-xs sm:text-sm">
              {/* 1. Chọn Nhà Cung Cấp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. NHÀ CUNG CẤP GIAO HÀNG (*)
                </label>
                <select
                  value={receiveSupplierId || ''}
                  onChange={(e) => setReceiveSupplierId(Number(e.target.value) || undefined)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-orange-500"
                >
                  {suppliersList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.supplierName} ({s.supplierCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Chọn Mặt Hàng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. MẶT HÀNG / NGUYÊN LIỆU NHẬN (*)
                </label>
                <select
                  value={receiveItemId || ''}
                  onChange={(e) => setReceiveItemId(Number(e.target.value) || undefined)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-orange-500"
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.itemName} ({it.unit || 'kg'})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Phân vùng Kho Vật Lý */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. VỊ TRÍ KHO LƯU TRỮ VẬT LÝ
                </label>
                <select
                  value={receiveLocation}
                  onChange={(e) => setReceiveLocation(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="KHO_BE_SONG">🦀 Bể hải sản sống (Cua, ghẹ, tôm...)</option>
                  <option value="KHO_DONG_LANH">❄️ Kho đông lạnh (Thịt, cá phi lê...)</option>
                  <option value="KHO_KHO">📦 Kho khô (Gia vị, gạo, đường...)</option>
                  <option value="KHO_BEP">🍳 Kho bếp (Nguyên liệu chế biến tại bếp)</option>
                  <option value="KHO_BAR">🍹 Kho bar (Hoa quả, nước ngọt...)</option>
                </select>
              </div>

              {/* 4. Số Cân Thực Tế (kg) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4. SỐ CÂN THỰC TẾ TRÊN BÀN CÂN (KG) (*)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={receiveWeight}
                  onChange={(e) => setReceiveWeight(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === ',') {
                      e.preventDefault();
                      const cur = String(receiveWeight ?? '');
                      if (!cur.includes('.')) {
                        setReceiveWeight((cur ? cur : '0') + '.');
                      }
                    }
                  }}
                  className="w-full h-12 px-3 rounded-xl border-2 border-orange-400 font-mono font-black text-lg text-orange-950 bg-orange-50/50 focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Cho phép nhập số lẻ chính xác đến 2 chữ số (ví dụ: 2.33 kg, 15.75 kg)
                </span>
              </div>

              {/* 5. Chụp Ảnh Bàn Cân / Phiếu Giao (*) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <span>5. ẢNH BÀN CÂN / PHIẾU GIAO HÀNG</span>
                  <span className="text-rose-600 font-black text-sm">(*)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={receivePhotoInputRef}
                  onChange={handleReceivePhotoUpload}
                  className="hidden"
                />

                {receivePhoto ? (
                  <div className="relative rounded-2xl border border-slate-300 overflow-hidden bg-black/5 p-2 flex items-center justify-between">
                    <img
                      src={receivePhoto.dataUrl}
                      alt="Ảnh bàn cân"
                      className="h-20 w-28 object-cover rounded-xl border border-slate-200"
                    />
                    <div className="flex-1 px-3">
                      <p className="text-xs font-bold text-slate-800">Ảnh đã chụp thành công</p>
                      <p className="text-[10px] text-slate-500">Dung lượng nén: {receivePhoto.compressedSizeKb} KB (kèm Watermark)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceivePhoto(null)}
                      className="p-1.5 rounded-full bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => receivePhotoInputRef.current?.click()}
                    className="w-full h-20 rounded-2xl border-2 border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/40 hover:bg-orange-50 flex flex-col items-center justify-center gap-1.5 text-orange-700 font-bold text-xs transition-colors"
                  >
                    <Camera className="h-6 w-6 text-orange-600" />
                    <span>Bấm để Mở Camera Chụp Ảnh Bàn Cân</span>
                  </button>
                )}
              </div>

              {/* 6. Ghi Chú (Tùy chọn) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  6. GHI CHÚ BẾP (TÙY CHỌN)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cua khỏe, đều con; tôm còn tươi nhảy sủi..."
                  value={receiveNote}
                  onChange={(e) => setReceiveNote(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="btn-touch h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
                >
                  ĐÓNG
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReceive}
                  className="btn-touch h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30"
                >
                  {isSubmittingReceive ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>ĐANG LƯU...</span>
                    </>
                  ) : (
                    <span>LƯU PHIẾU CÂN HÀNG</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenModule;
