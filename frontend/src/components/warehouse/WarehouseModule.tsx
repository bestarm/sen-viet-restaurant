import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Boxes,
  PackagePlus,
  ClipboardCheck,
  Building2,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
  Download,
  Upload,
  Plus,
  Trash2,
  Search,
  Eye,
  Camera,
  X,
  Loader2,
  RotateCw,
  Clock,
  ChevronRight,
  ShieldAlert,
  FileSpreadsheet,
  Award,
  Layers,
  ArrowUpDown,
  Phone,
  MapPin,
  Tag,
  Scale,
  MinusCircle,
  Calculator,
  DollarSign,
  Printer,
  Sparkles,
  Package,
  ArrowRightLeft,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { userHasRole } from '../../utils/rbac';
import {
  warehouseApi,
  Supplier,
  ImportBatch,
  WarehouseDocument,
  InventoryStock,
  InventoryCheck,
  SupplierLossReport,
  SupplierDebtSummary,
  CreateDocumentRequest,
  CreateSupplierRequest,
  CreateInventoryCheckRequest,
  WAREHOUSE_LOCATIONS,
  getItemWarehouseLocation,
  PhysicalWarehouseLocation,
} from '../../api/warehouse';
import { kitchenApi, Item } from '../../api/kitchen';
import { compressImage, CompressionResult } from '../../utils/imageCompressor';

// Helper Components
import { HDImageModal } from './HDImageModal';
import { DeliveryVoucherModal } from './DeliveryVoucherModal';
import { StockCardsTab } from './StockCardsTab';
import { SupplierDebtReconciliationTab } from './SupplierDebtReconciliationTab';

export type WarehouseTab =
  | 'stock-overview'
  | 'documents'
  | 'inventory-check'
  | 'supplier-partner';

export const WAREHOUSE_COCKPIT_TABS: WarehouseTab[] = [
  'stock-overview',
  'documents',
  'inventory-check',
  'supplier-partner',
];

export const WarehouseModule: React.FC = () => {
  const { user } = useAuth();
  const { showError, showSuccess, showWarning } = useNotification();

  // Phân quyền chi tiết cho Phân hệ Kho (Sprint 3 RBAC)
  const isChuChuoi = userHasRole(user, 'ROLE_CHU_CHUOI') || user?.username === 'admin_chu';
  const isHeadChef = userHasRole(user, 'ROLE_QL_BEP') || user?.username === 'ql_bep_tn';
  const isBranchMgr = userHasRole(user, 'ROLE_QL_CHINHANH') || user?.username === 'ql_chinhanh_tn';
  const isGenAcc =
    userHasRole(user, 'ROLE_GENERAL_ACCOUNTANT') ||
    userHasRole(user, 'ROLE_KETOAN_TONG') ||
    user?.username === 'ketoan_tong';
  const isBrAcc =
    userHasRole(user, 'ROLE_BRANCH_ACCOUNTANT') ||
    userHasRole(user, 'ROLE_KETOAN_CHINHANH') ||
    user?.username === 'ketoan_tn' ||
    user?.username === 'ketoan_qv';
  const isKitchen = userHasRole(user, 'ROLE_KITCHEN_STAFF');
  // Bếp viên thuần túy: được xem tồn vật lý & cân hàng mới về, ẩn đơn giá & công nợ tài chính nhạy cảm
  const isKitchenPure = isKitchen && !isBranchMgr && !isHeadChef && !isChuChuoi && !isGenAcc && !isBrAcc;

  // TASK-LOGIC-05: Bảo mật tài chính: Ẩn giá tiền đối với Bếp Trưởng, Bếp viên và Nhân viên
  const isKitchenStaff = isKitchen;
  const hideFinancials = isHeadChef || isKitchenStaff || (!isChuChuoi && !isGenAcc && !isBrAcc && !isBranchMgr);

  // Active top tab - 4 nhóm Cockpit chuẩn hóa
  const [activeTab, setActiveTab] = useState<WarehouseTab>('stock-overview');
  const [stockSubTab, setStockSubTab] = useState<'cards' | 'batches'>('cards');
  const [supplierSubTab, setSupplierSubTab] = useState<'recon' | 'loss-report' | 'suppliers'>(
    isKitchenPure ? 'loss-report' : 'recon'
  );

  // Common notification
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showNotice = (type: 'success' | 'error' | 'warning', text: string) => {
    setNotice({ type: type === 'warning' ? 'error' : type, text });
    setTimeout(() => setNotice(null), 6000);

    if (type === 'error') {
      showError(text, 'LỖI PHÂN HỆ KHO');
    } else if (type === 'warning') {
      showWarning(text, 'CẢNH BÁO KHO & LÔ HÀNG');
    } else {
      showSuccess(text, 'THAO TÁC KHO THÀNH CÔNG');
    }
  };

  // Common data
  const [buffetItems, setBuffetItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [documents, setDocuments] = useState<WarehouseDocument[]>([]);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [stocks, setStocks] = useState<InventoryStock[]>([]);
  const [checks, setChecks] = useState<InventoryCheck[]>([]);
  const [lossReports, setLossReports] = useState<SupplierLossReport[]>([]);
  const [supplierDebts, setSupplierDebts] = useState<SupplierDebtSummary[]>([]);
  const [isExportingDebt, setIsExportingDebt] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters for Documents Tab (Objective 2: Flexible filter bar)
  const [docTypeFilter, setDocTypeFilter] = useState<string>('ALL');
  const [docBranchFilter, setDocBranchFilter] = useState<string>('ALL');
  const [docDateFrom, setDocDateFrom] = useState<string>('');
  const [docDateTo, setDocDateTo] = useState<string>('');
  const [docSupplierFilter, setDocSupplierFilter] = useState<string>('ALL');
  const [docSearchTerm, setDocSearchTerm] = useState<string>('');

  // Filters for Batches Tab
  const [batchSearchTerm, setBatchSearchTerm] = useState<string>('');
  const [batchSupplierFilter, setBatchSupplierFilter] = useState<string>('ALL');
  const [batchStockFilter, setBatchStockFilter] = useState<'ALL' | 'SAFE' | 'LOW' | 'EMPTY'>('ALL');
  const [batchPage, setBatchPage] = useState<number>(1);
  const [batchPageSize, setBatchPageSize] = useState<number>(8);

  // Filters for Loss Report Tab
  const [reportMonth, setReportMonth] = useState<number>(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());

  // Filters for Inventory Check Tab (Objective 5)
  const [checkCategoryFilter, setCheckCategoryFilter] = useState<string>('ALL');
  const [checkHighValueOnly, setCheckHighValueOnly] = useState<boolean>(false);
  const [checkModalCategory, setCheckModalCategory] = useState<string>('ALL');
  const [checkModalHighValueOnly, setCheckModalHighValueOnly] = useState<boolean>(false);

  // Helper tính toán trực quan Hạn sử dụng Lô hàng
  const getExpiryInfo = (expiryDateStr?: string) => {
    if (!expiryDateStr) {
      return {
        status: 'none' as const,
        label: 'Không ghi hạn',
        colorClass: 'bg-slate-100 text-slate-500 border-slate-200',
      };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDateStr);
    exp.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'expired' as const,
        label: `QUÁ HẠN (${Math.abs(diffDays)} ngày)`,
        colorClass: 'bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse',
      };
    }
    if (diffDays <= 3) {
      return {
        status: 'warning' as const,
        label: diffDays === 0 ? 'HẾT HẠN HÔM NAY' : `Cận hạn (còn ${diffDays} ngày)`,
        colorClass: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
      };
    }
    return {
      status: 'safe' as const,
      label: `Còn ${diffDays} ngày (${expiryDateStr})`,
      colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
    };
  };

  // Helper tính toán trực quan Thanh trạng thái Tồn kho
  const getStockInfo = (current: number, initial: number) => {
    const cur = Number(current) || 0;
    const init = Number(initial) || 1;
    const percentage = Math.max(0, Math.min(100, Math.round((cur / init) * 100)));

    if (cur <= 0) {
      return {
        status: 'empty' as const,
        label: 'Hết hàng (0%)',
        barColor: 'bg-rose-500',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        percentage: 0,
      };
    }
    if (percentage <= 25) {
      return {
        status: 'low' as const,
        label: `Sắp hết (${percentage}%)`,
        barColor: 'bg-amber-500',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        percentage,
      };
    }
    return {
      status: 'safe' as const,
      label: `An toàn (${percentage}%)`,
      barColor: 'bg-emerald-500',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      percentage,
    };
  };

  // Helper nhận diện mặt hàng đắt tiền / nhạy cảm (Objective 5)
  const isHighValueItem = (item: { itemCode?: string; itemName?: string; unitPrice?: number; costPrice?: number }): boolean => {
    const code = (item.itemCode || '').toUpperCase();
    const name = (item.itemName || '').toLowerCase();
    const price = Number(item.unitPrice || item.costPrice || 0);

    return (
      code.includes('HS-') ||
      code.includes('TB-') ||
      price >= 190000 ||
      name.includes('cua') ||
      name.includes('ghẹ') ||
      name.includes('tôm') ||
      name.includes('cá hồi') ||
      name.includes('bò') ||
      name.includes('mực') ||
      name.includes('bạch tuộc')
    );
  };

  // =========================================================================
  // MODAL STATES
  // =========================================================================
  // Modal Tạo Phiếu Nhập / Huỷ Kho
  const [showDocModal, setShowDocModal] = useState<boolean>(false);
  const [docType, setDocType] = useState<'NHAP' | 'XUAT_CHUYEN' | 'HUY'>('NHAP');
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | undefined>(undefined);
  const [docNote, setDocNote] = useState<string>('');
  const [docItems, setDocItems] = useState<
    {
      itemId: number;
      quantity: number | string;
      unitPrice: number;
      expiryDate: string;
      batchId?: number;
      supplierReportedWeight?: number | string;
      actualWeight?: number | string;
      weightDiff?: number;
      shortageAmount?: number;
      lossCategory?: 'HAI_SAN_CHET_NCC' | 'HONG_BAO_QUAN_KHO' | 'BEP_LAM_HONG' | string;
      reasonDetail?: string;
    }[]
  >([]);
  const [docImages, setDocImages] = useState<CompressionResult[]>([]);
  const [activeDocImgIndex, setActiveDocImgIndex] = useState<number>(0);
  const [selectedWarehouseLocation, setSelectedWarehouseLocation] = useState<string>('KHO_KHO');
  const [isSubmittingDoc, setIsSubmittingDoc] = useState<boolean>(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // TASK-PC-07: Phím tắt PC bàn phím cứng (Escape đóng modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDocModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // KHO-06: Quyền phê duyệt báo hỏng (Quản lý chi nhánh, Bếp trưởng & Ban Giám đốc)
  const canApproveWaste = useMemo(() => {
    if (!user) return false;
    return (
      userHasRole(user, 'ROLE_QL_CHINHANH') ||
      userHasRole(user, 'ROLE_CHU_CHUOI') ||
      userHasRole(user, 'ROLE_KETOAN_TONG') ||
      userHasRole(user, 'ROLE_RESTAURANT_MANAGER') ||
      userHasRole(user, 'ROLE_QL_BEP') ||
      user.username === 'ql_chinhanh_tn' ||
      user.username === 'admin_chu' ||
      user.username === 'ketoan_tong' ||
      user.username === 'ql_bep_tn'
    );
  }, [user]);

  const handleApproveDoc = async (doc: WarehouseDocument) => {
    try {
      await warehouseApi.approveDocument(doc.id, user?.fullName || 'Lê Hoàng Quản Lý');
      showNotice(
        'success',
        `✅ Đã duyệt xuất hủy phiếu ${doc.docCode}. Tồn kho đã được trừ chính thức!`
      );
      await loadAllData();
    } catch (err: any) {
      console.error('Lỗi khi duyệt phiếu:', err);
      showNotice('error', 'Lỗi khi duyệt phiếu: ' + (err.message || 'Lỗi hệ thống'));
    }
  };

  const handleRejectDoc = async (doc: WarehouseDocument) => {
    try {
      await warehouseApi.rejectDocument(doc.id, 'Quản lý từ chối duyệt xuất hủy');
      showNotice(
        'success',
        `❌ Đã từ chối phiếu xuất hủy ${doc.docCode}.`
      );
      await loadAllData();
    } catch (err: any) {
      console.error('Lỗi khi từ chối phiếu:', err);
      showNotice('error', 'Lỗi khi từ chối phiếu: ' + (err.message || 'Lỗi hệ thống'));
    }
  };

  // Modal Chi Tiết Phiếu Kho
  const [viewingDoc, setViewingDoc] = useState<WarehouseDocument | null>(null);

  // Modal In / Xem Phiếu Giao Nhận A4 (Objective 2: Delivery Voucher Modal)
  const [viewingVoucherDoc, setViewingVoucherDoc] = useState<WarehouseDocument | null>(null);

  // Modal Phóng To Ảnh HD (Objective 2: HD Image Modal)
  const [hdImages, setHdImages] = useState<string[]>([]);
  const [hdImageIndex, setHdImageIndex] = useState<number>(0);
  const [isHDImageOpen, setIsHDImageOpen] = useState<boolean>(false);
  const [hdDocCode, setHdDocCode] = useState<string>('');

  const handleOpenHDImage = (images: string[], index = 0, docCode = '') => {
    setHdImages(images);
    setHdImageIndex(index);
    setHdDocCode(docCode);
    setIsHDImageOpen(true);
  };

  // Modal Thêm / Sửa Nhà Cung Cấp
  const [showSupplierModal, setShowSupplierModal] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierCode, setSupplierCode] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [supplierPhone, setSupplierPhone] = useState<string>('');
  const [supplierAddress, setSupplierAddress] = useState<string>('');
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState<boolean>(false);

  // Modal / Form Kiểm Kê Kho Đầu Ca / Cuối Ca
  const [showCheckModal, setShowCheckModal] = useState<boolean>(false);
  const [checkShift, setCheckShift] = useState<string>('CA_TOI');
  const [checkDate, setCheckDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [checkNote, setCheckNote] = useState<string>('');
  const [checkItemRows, setCheckItemRows] = useState<
    {
      itemId: number;
      itemName: string;
      itemCode: string;
      unit: string;
      category?: string;
      batchId?: number;
      batchCode?: string;
      systemStock: number;
      actualStock: number;
      reason: string;
    }[]
  >([]);
  const [isSubmittingCheck, setIsSubmittingCheck] = useState<boolean>(false);
  const [viewingCheck, setViewingCheck] = useState<InventoryCheck | null>(null);

  // Export State
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  // =========================================================================
  // LOAD DATA
  // =========================================================================
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [itemsRes, suppliersRes, docsRes, batchesRes, stocksRes, checksRes, lossRes, debtsRes] =
        await Promise.allSettled([
          kitchenApi.getBuffetItems(),
          warehouseApi.getSuppliers(),
          warehouseApi.getDocuments(),
          warehouseApi.getAllBatches(),
          warehouseApi.getStocks(),
          warehouseApi.getInventoryChecks(),
          warehouseApi.getSupplierLossReport({ month: reportMonth, year: reportYear }),
          warehouseApi.getSupplierDebtSummary({ branchId: user?.branchId || 1 }),
        ]);

      if (itemsRes.status === 'fulfilled') setBuffetItems(itemsRes.value);
      if (suppliersRes.status === 'fulfilled') setSuppliers(suppliersRes.value);
      if (docsRes.status === 'fulfilled') setDocuments(docsRes.value);
      if (batchesRes.status === 'fulfilled') setBatches(batchesRes.value);
      if (stocksRes.status === 'fulfilled') setStocks(stocksRes.value);
      if (checksRes.status === 'fulfilled') setChecks(checksRes.value);
      if (lossRes.status === 'fulfilled') setLossReports(lossRes.value);
      if (debtsRes.status === 'fulfilled') setSupplierDebts(debtsRes.value);
    } catch (err) {
      console.error('Lỗi khi nạp dữ liệu phân hệ kho:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [reportMonth, reportYear]);

  // =========================================================================
  // HELPER TÍNH TỒN KHẢ DỤNG TỨC THỜI (OBJECTIVE 1)
  // =========================================================================
  const getAvailableStock = (
    itemId: number,
    batchId?: number
  ): { stock: number; unit: string; batchName?: string; supplierName?: string } => {
    const item = buffetItems.find((i) => i.id === itemId);
    const unit = item?.unit || 'kg';

    if (batchId) {
      const foundBatch = batches.find((b) => b.id === batchId);
      if (foundBatch) {
        return {
          stock: Number(foundBatch.currentStock) || 0,
          unit: foundBatch.unit || unit,
          batchName: foundBatch.batchCode,
          supplierName: foundBatch.supplierName,
        };
      }
    }

    // Sum across batches for this item
    const itemBatches = batches.filter((b) => b.itemId === itemId);
    if (itemBatches.length > 0) {
      const total = itemBatches.reduce((acc, b) => acc + (Number(b.currentStock) || 0), 0);
      return { stock: Number(total.toFixed(2)), unit };
    }

    const foundStock = stocks.find((s) => s.itemId === itemId);
    if (foundStock) {
      return { stock: Number(foundStock.quantity) || 0, unit: foundStock.unit || unit };
    }

    return { stock: item?.isBuffetLine ? 25 : 12, unit };
  };

  // =========================================================================
  // HANDLERS: WAREHOUSE DOCUMENTS & FORM PHIẾU
  // =========================================================================
  const handleOpenDocModal = (type: 'NHAP' | 'XUAT_CHUYEN' | 'HUY') => {
    setDocType(type);
    setSelectedSupplierId(suppliers.length > 0 ? suppliers[0].id : undefined);
    setSelectedWarehouseLocation(type === 'XUAT_CHUYEN' ? 'KHO_BEP' : 'KHO_KHO');
    setDocNote(
      type === 'XUAT_CHUYEN'
        ? 'Xuất gia vị, dầu ăn, đường từ Kho Khô sang Bếp chế biến trong ca'
        : ''
    );
    setDocImages([]);

    // Default 1 line item
    if (buffetItems.length > 0) {
      const defaultItemId = buffetItems[0].id;
      const itemBatches = batches.filter((b) => b.itemId === defaultItemId && b.currentStock > 0);
      const defaultBatchId = itemBatches.length > 0 ? itemBatches[0].id : undefined;

      setDocItems([
        {
          itemId: defaultItemId,
          batchId: defaultBatchId,
          quantity: '',
          supplierReportedWeight: '',
          actualWeight: '',
          weightDiff: 0,
          shortageAmount: 0,
          unitPrice: buffetItems[0].costPrice || 250000,
          expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          lossCategory: type === 'HUY' ? 'HAI_SAN_CHET_NCC' : undefined,
          reasonDetail: '',
        },
      ]);
    } else {
      setDocItems([]);
    }
    setShowDocModal(true);
  };

  const handleAddDocItem = () => {
    if (buffetItems.length === 0) return;
    const defaultItemId = buffetItems[0].id;
    const itemBatches = batches.filter((b) => b.itemId === defaultItemId && b.currentStock > 0);
    const defaultBatchId = itemBatches.length > 0 ? itemBatches[0].id : undefined;

    setDocItems([
      ...docItems,
      {
        itemId: defaultItemId,
        batchId: defaultBatchId,
        quantity: '',
        supplierReportedWeight: '',
        actualWeight: '',
        weightDiff: 0,
        shortageAmount: 0,
        unitPrice: buffetItems[0].costPrice || 200000,
        expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        lossCategory: docType === 'HUY' ? 'HAI_SAN_CHET_NCC' : undefined,
        reasonDetail: '',
      },
    ]);
  };

  const handleRemoveDocItem = (index: number) => {
    setDocItems(docItems.filter((_, i) => i !== index));
  };

  const handleDocItemChange = (index: number, field: string, value: any) => {
    const updated = [...docItems];
    if (field === 'itemId') {
      const selectedItem = buffetItems.find((i) => i.id === Number(value));
      const newPrice = selectedItem?.costPrice || updated[index].unitPrice;
      const diff = updated[index].weightDiff || 0;
      const itemBatches = batches.filter((b) => b.itemId === Number(value) && b.currentStock > 0);
      const newBatchId = itemBatches.length > 0 ? itemBatches[0].id : undefined;

      updated[index] = {
        ...updated[index],
        itemId: Number(value),
        batchId: newBatchId,
        unitPrice: newPrice,
        shortageAmount: diff < 0 ? Math.round(Math.abs(diff) * newPrice) : 0,
      };
    } else if (field === 'supplierReportedWeight') {
      const val = typeof value === 'string' ? value.replace(',', '.') : value;
      const rep = parseFloat(val) || 0;
      const act =
        parseFloat(String(updated[index].actualWeight || updated[index].quantity || 0)) || 0;
      const diff = Number((act - rep).toFixed(2));
      const shortage = diff < 0 ? Math.round(Math.abs(diff) * updated[index].unitPrice) : 0;
      updated[index] = {
        ...updated[index],
        supplierReportedWeight: val,
        weightDiff: diff,
        shortageAmount: shortage,
      };
    } else if (field === 'actualWeight') {
      const val = typeof value === 'string' ? value.replace(',', '.') : value;
      const act = parseFloat(val) || 0;
      const rep =
        parseFloat(String(updated[index].supplierReportedWeight || act)) || 0;
      const diff = Number((act - rep).toFixed(2));
      const shortage = diff < 0 ? Math.round(Math.abs(diff) * updated[index].unitPrice) : 0;
      updated[index] = {
        ...updated[index],
        actualWeight: val,
        quantity: val,
        weightDiff: diff,
        shortageAmount: shortage,
      };
    } else if (field === 'quantity') {
      const val = typeof value === 'string' ? value.replace(',', '.') : value;
      const act = parseFloat(val) || 0;
      const rep =
        parseFloat(String(updated[index].supplierReportedWeight || act)) || act;
      const diff = Number((act - rep).toFixed(2));
      const shortage = diff < 0 ? Math.round(Math.abs(diff) * updated[index].unitPrice) : 0;
      updated[index] = {
        ...updated[index],
        quantity: val,
        actualWeight: val,
        weightDiff: diff,
        shortageAmount: shortage,
      };
    } else if (field === 'unitPrice') {
      const price = parseFloat(value) || 0;
      const diff = updated[index].weightDiff || 0;
      updated[index] = {
        ...updated[index],
        unitPrice: price,
        shortageAmount: diff < 0 ? Math.round(Math.abs(diff) * price) : 0,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setDocItems(updated);
  };

  const handleDocPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (docImages.length + files.length > 5) {
      showNotice('error', 'Chỉ được đính kèm tối đa 5 ảnh hóa đơn/chứng từ');
      return;
    }

    try {
      const compressedList: CompressionResult[] = [];
      const branchName =
        user?.branchName || (user?.branchId === 2 ? 'Sen Việt - Quế Võ' : 'Sen Việt - Thái Nguyên');
      const userName = user?.fullName || 'Bếp viên';
      const docTitle =
        docType === 'NHAP'
          ? 'Phiếu Nhập Kho'
          : docType === 'HUY'
          ? 'Phiếu Xuất Hủy'
          : 'Xuất Kho Sang Bếp';

      for (let i = 0; i < files.length; i++) {
        // KHO-03: Áp dụng watermark tự động in đè thông tin chi nhánh, thời gian thực, người thực hiện
        const res = await compressImage(files[i], 1280, 720, 0.75, {
          branchName,
          userName,
          docType: docTitle,
          docTypeName: docTitle,
        });
        compressedList.push(res);
      }
      setDocImages([...docImages, ...compressedList]);
      showNotice('success', `Đã nén và thêm ${files.length} ảnh chứng từ kèm Watermark thành công`);
    } catch (err) {
      console.error('Lỗi khi nén ảnh phiếu kho:', err);
      showNotice('error', 'Lỗi khi nén ảnh chứng từ');
    } finally {
      if (docFileInputRef.current) docFileInputRef.current.value = '';
    }
  };

  const calculateDocTotals = () => {
    let totalReported = 0;
    let totalActual = 0;
    let totalShortage = 0;

    for (const it of docItems) {
      const price = Number(it.unitPrice) || 0;
      const act =
        typeof it.actualWeight === 'string'
          ? parseFloat(it.actualWeight) || 0
          : it.actualWeight ?? (parseFloat(String(it.quantity)) || 0);
      const rep =
        typeof it.supplierReportedWeight === 'string'
          ? parseFloat(it.supplierReportedWeight) || act
          : it.supplierReportedWeight ?? act;

      const diff = Number((act - rep).toFixed(2));
      const shortage = diff < 0 ? Math.round(Math.abs(diff) * price) : 0;

      totalReported += rep * price;
      totalActual += act * price;
      totalShortage += shortage;
    }

    return {
      totalReported,
      totalActual,
      totalShortage,
      finalPayable: Math.max(0, totalReported - totalShortage),
    };
  };

  const handleSubmitDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (docItems.length === 0) {
      showNotice('error', 'Vui lòng thêm ít nhất một mặt hàng vào phiếu');
      return;
    }

    // KHO-03: BẮT BUỘC CHỤP ẢNH BÀN CÂN / CHỨNG TỪ (*)
    if (docImages.length === 0) {
      showNotice('error', '⚠️ Vui lòng chụp ảnh bàn cân hoặc phiếu giao hàng trước khi lưu!');
      return;
    }

    // Kiểm tra mọi dòng phải có quantity/thực cân > 0
    const hasInvalidQty = docItems.some((item) => {
      const q = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
      const act =
        typeof item.actualWeight === 'string'
          ? parseFloat(item.actualWeight)
          : item.actualWeight;
      const effective = act !== undefined && !isNaN(act) && act > 0 ? act : q;
      return effective === undefined || isNaN(effective as number) || (effective as number) <= 0;
    });

    if (hasInvalidQty) {
      showNotice('error', 'Vui lòng nhập số lượng/thực cân hợp lệ (> 0) cho tất cả các mặt hàng');
      return;
    }

    // KHO-04: Bắt buộc chọn NCC hoặc Lô nhập khi lý do là Cua/Hải sản chết để bắt đền
    if (docType === 'HUY') {
      for (const item of docItems) {
        if (item.lossCategory === 'HAI_SAN_CHET_NCC' && !item.batchId && !selectedSupplierId) {
          showNotice(
            'error',
            '⚠️ Với lý do Cua / Hải sản chết (Bắt đền NCC), bắt buộc phải chọn Lô nhập hoặc Nhà cung cấp để gắn trách nhiệm bồi hoàn!'
          );
          return;
        }
      }
    }

    // OBJECTIVE 1: Chặn cứng xuất âm kho khi xuất hủy
    if (docType === 'HUY') {
      for (const item of docItems) {
        const q = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
        const act =
          typeof item.actualWeight === 'string' ? parseFloat(item.actualWeight) : item.actualWeight;
        const effective = act !== undefined && !isNaN(act) && act > 0 ? act : q;
        const avail = getAvailableStock(item.itemId, item.batchId).stock;

        if (Number(effective) > avail) {
          const it = buffetItems.find((b) => b.id === item.itemId);
          showNotice(
            'error',
            `❌ VI PHẠM XUẤT ÂM KHO: Mặt hàng '${it?.itemName || 'Nguyên liệu'}' có số lượng hủy (${effective} kg) vượt quá tồn kho khả dụng (${avail} kg)! Hệ thống chặn lưu phiếu để đảm bảo tính toàn vẹn tồn kho.`
          );
          return;
        }
      }
    }

    // KHO-14: Chặn xuất âm kho khi xuất chuyển nội bộ Kho Khô sang Bếp
    if (docType === 'XUAT_CHUYEN') {
      for (const item of docItems) {
        const q = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
        const avail = getAvailableStock(item.itemId, item.batchId).stock;
        if (Number(q) > avail) {
          const it = buffetItems.find((b) => b.id === item.itemId);
          showNotice(
            'error',
            `❌ VI PHẠM XUẤT ÂM KHO: Mặt hàng '${it?.itemName || 'Hàng khô'}' có số lượng chuyển (${q} kg) vượt quá tồn kho khả dụng (${avail} kg)! Hệ thống chặn lưu phiếu.`
          );
          return;
        }
      }
    }

    try {
      setIsSubmittingDoc(true);
      const payload: CreateDocumentRequest = {
        branchId: user?.branchId || 1,
        branchCode: (user?.branchId === 2 ? 'QV' : 'TN') as any,
        docType,
        supplierId: docType === 'NHAP' ? selectedSupplierId : (docType === 'HUY' ? selectedSupplierId : undefined),
        status: docType === 'HUY' ? 'CHO_DUYET' : 'HOAN_THANH',
        warehouseLocation: selectedWarehouseLocation,
        note: docNote || undefined,
        imageUrls: docImages.map((img) => img.dataUrl).join(';'),
        items: docItems.map((item) => {
          const act =
            typeof item.actualWeight === 'string'
              ? parseFloat(item.actualWeight)
              : item.actualWeight;
          const rep =
            typeof item.supplierReportedWeight === 'string'
              ? parseFloat(item.supplierReportedWeight)
              : item.supplierReportedWeight;
          const qty =
            typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
          const price =
            typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice;

          const effectiveActual = act !== undefined && !isNaN(act) ? act : qty;
          const effectiveRep =
            rep !== undefined && !isNaN(rep) ? rep : effectiveActual;
          const diff = Number((effectiveActual - effectiveRep).toFixed(2));
          const shortage = diff < 0 ? Math.round(Math.abs(diff) * price) : 0;

          return {
            itemId: item.itemId,
            quantity: effectiveActual,
            actualWeight: effectiveActual,
            supplierReportedWeight: effectiveRep,
            weightDiff: diff,
            shortageAmount: shortage,
            unitPrice: price,
            expiryDate: item.expiryDate || undefined,
            batchId: item.batchId,
            lossCategory: item.lossCategory || (docType === 'HUY' ? 'HAI_SAN_CHET_NCC' : undefined),
            reason: item.reasonDetail || undefined,
            warehouseLocation: selectedWarehouseLocation,
          };
        }),
      };

      const res = await warehouseApi.createDocument(payload);
      showNotice(
        'success',
        docType === 'HUY'
          ? `✅ Đã lập phiếu xuất hủy ${res.docCode}! Phiếu đang ở trạng thái 'Chờ Quản lý duyệt'.`
          : docType === 'XUAT_CHUYEN'
          ? `✅ Đã lập phiếu xuất chuyển ${res.docCode} sang Bếp thành công! Tồn kho hàng khô đã được trừ.`
          : `✅ Đã tạo phiếu nhập kho ${res.docCode} thành công! Tồn kho & Công nợ NCC đã được cập nhật.`
      );
      setShowDocModal(false);
      loadAllData();
    } catch (err: any) {
      console.error('Lỗi tạo phiếu kho:', err);
      showNotice('error', 'Lỗi khi lưu phiếu kho: ' + (err.message || 'Lỗi hệ thống'));
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  // =========================================================================
  // HANDLERS: NHÀ CUNG CẤP & KIỂM KÊ
  // =========================================================================
  const handleOpenSupplierModal = (sup?: Supplier) => {
    if (sup) {
      setEditingSupplier(sup);
      setSupplierCode(sup.supplierCode);
      setSupplierName(sup.supplierName);
      setSupplierPhone(sup.phone || '');
      setSupplierAddress(sup.address || '');
    } else {
      setEditingSupplier(null);
      setSupplierCode(`NCC-${Date.now().toString().slice(-4)}`);
      setSupplierName('');
      setSupplierPhone('');
      setSupplierAddress('');
    }
    setShowSupplierModal(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierCode.trim() || !supplierName.trim()) {
      showNotice('error', 'Mã và Tên Nhà Cung Cấp không được để trống');
      return;
    }

    try {
      setIsSubmittingSupplier(true);
      const payload: CreateSupplierRequest = {
        supplierCode: supplierCode.trim(),
        supplierName: supplierName.trim(),
        phone: supplierPhone.trim() || undefined,
        address: supplierAddress.trim() || undefined,
        status: 'ACTIVE',
      };

      if (editingSupplier) {
        await warehouseApi.updateSupplier(editingSupplier.id, payload);
        showNotice('success', `Đã cập nhật nhà cung cấp ${payload.supplierName} thành công`);
      } else {
        await warehouseApi.createSupplier(payload);
        showNotice('success', `Đã thêm mới nhà cung cấp ${payload.supplierName} thành công`);
      }

      setShowSupplierModal(false);
      loadAllData();
    } catch (err: any) {
      console.error('Lỗi lưu nhà cung cấp:', err);
      showNotice('error', 'Lỗi khi lưu nhà cung cấp: ' + (err.message || 'Lỗi hệ thống'));
    } finally {
      setIsSubmittingSupplier(false);
    }
  };

  const handleOpenCheckModal = () => {
    setCheckShift('CA_TOI');
    setCheckDate(new Date().toISOString().split('T')[0]);
    setCheckNote('');
    setCheckModalCategory('ALL');
    setCheckModalHighValueOnly(false);

    // Pre-populate items from current stocks or buffet items
    const rows = (stocks.length > 0 ? stocks : buffetItems).map((item: any) => {
      const currentQty = item.quantity !== undefined ? Number(item.quantity) : 25;
      return {
        itemId: item.itemId || item.id,
        itemName: item.itemName,
        itemCode: item.itemCode,
        unit: item.unit,
        category: item.category,
        batchId: item.batchId,
        batchCode: item.batchCode,
        systemStock: currentQty,
        actualStock: currentQty,
        reason: '',
      };
    });

    setCheckItemRows(rows);
    setShowCheckModal(true);
  };

  const handleActualStockChange = (index: number, val: number) => {
    const updated = [...checkItemRows];
    updated[index].actualStock = val;
    setCheckItemRows(updated);
  };

  const handleReasonChange = (index: number, reason: string) => {
    const updated = [...checkItemRows];
    updated[index].reason = reason;
    setCheckItemRows(updated);
  };

  const handleSubmitInventoryCheck = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check validation: any difference must have reason
    const unreasonedItems = checkItemRows.filter(
      (r) => r.actualStock !== r.systemStock && !r.reason.trim()
    );

    if (unreasonedItems.length > 0) {
      showNotice(
        'warning',
        `⚠️ Có ${unreasonedItems.length} mặt hàng chênh lệch chưa điền lý do! Quy chuẩn kiểm kê bắt buộc phải giải trình lý do lệch.`
      );
      return;
    }

    try {
      setIsSubmittingCheck(true);
      const payload: CreateInventoryCheckRequest = {
        branchId: user?.branchId || 1,
        shift: checkShift,
        checkDate: checkDate,
        note: checkNote || undefined,
        items: checkItemRows.map((r) => ({
          itemId: r.itemId,
          batchId: r.batchId,
          systemStock: r.systemStock,
          actualStock: r.actualStock,
          reason: r.actualStock !== r.systemStock ? r.reason : undefined,
        })),
      };

      const res = await warehouseApi.createInventoryCheck(payload);
      showNotice('success', `✅ Đã lưu Biên Bản Kiểm Kê ${res.checkCode || ''} thành công!`);
      setShowCheckModal(false);
      loadAllData();
    } catch (err: any) {
      console.error('Lỗi khi lưu biên bản kiểm kê:', err);
      showNotice('error', err.response?.data?.message || 'Không thể lưu biên bản kiểm kê');
    } finally {
      setIsSubmittingCheck(false);
    }
  };

  const handleExportLossExcel = async () => {
    try {
      setIsExportingExcel(true);
      const blob = await warehouseApi.exportSupplierLossExcel({
        month: reportMonth,
        year: reportYear,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bao_Cao_Ty_Le_Hong_NCC_T${reportMonth}_${reportYear}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotice('success', '✅ Đã tải file Excel báo cáo % hỏng NCC thành công!');
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      showNotice('error', 'Không thể xuất file Excel. Vui lòng thử lại');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // =========================================================================
  // FILTERED DATA (OBJECTIVE 2: 4-WAY FLEXIBLE DOCUMENT FILTER)
  // =========================================================================
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // 1. Loại Phiếu
      if (docTypeFilter !== 'ALL' && doc.docType !== docTypeFilter) return false;

      // 2. Chi nhánh
      if (docBranchFilter !== 'ALL') {
        const bId = doc.branchId || 1;
        if (String(bId) !== docBranchFilter) return false;
      }

      // 3. Nhà Cung Cấp
      if (docSupplierFilter !== 'ALL') {
        const sId = String(doc.supplierId || '');
        const sCode = doc.supplierCode || '';
        if (sId !== docSupplierFilter && sCode !== docSupplierFilter) return false;
      }

      // 4. Ngày
      const docDate = (doc.createdAt || '').slice(0, 10);
      if (docDateFrom && docDate < docDateFrom) return false;
      if (docDateTo && docDate > docDateTo) return false;

      // 5. Ô tìm kiếm
      if (docSearchTerm.trim()) {
        const term = docSearchTerm.toLowerCase();
        const match =
          doc.docCode.toLowerCase().includes(term) ||
          (doc.supplierName && doc.supplierName.toLowerCase().includes(term)) ||
          (doc.note && doc.note.toLowerCase().includes(term)) ||
          (doc.createdBy && doc.createdBy.toLowerCase().includes(term)) ||
          (doc.items || []).some((it) => (it.itemName || '').toLowerCase().includes(term));
        if (!match) return false;
      }

      return true;
    });
  }, [
    documents,
    docTypeFilter,
    docBranchFilter,
    docSupplierFilter,
    docDateFrom,
    docDateTo,
    docSearchTerm,
  ]);

  const filteredBatches = batches.filter((b) => {
    if (batchSearchTerm.trim()) {
      const term = batchSearchTerm.toLowerCase();
      const match =
        b.batchCode.toLowerCase().includes(term) ||
        (b.itemName && b.itemName.toLowerCase().includes(term)) ||
        (b.supplierName && b.supplierName.toLowerCase().includes(term));
      if (!match) return false;
    }

    if (batchSupplierFilter !== 'ALL') {
      const sCode = b.supplierCode || b.supplierName || '';
      if (sCode !== batchSupplierFilter && b.supplierName !== batchSupplierFilter) {
        return false;
      }
    }

    if (batchStockFilter !== 'ALL') {
      const stockInfo = getStockInfo(b.currentStock, b.initialQuantity);
      if (batchStockFilter === 'SAFE' && stockInfo.status !== 'safe') return false;
      if (batchStockFilter === 'LOW' && stockInfo.status !== 'low') return false;
      if (batchStockFilter === 'EMPTY' && stockInfo.status !== 'empty') return false;
    }

    return true;
  });

  // Phân trang cho Desktop DataGrid
  const totalBatchPages = Math.max(1, Math.ceil(filteredBatches.length / batchPageSize));
  const paginatedBatches = filteredBatches.slice(
    (batchPage - 1) * batchPageSize,
    batchPage * batchPageSize
  );

  // Filtered checks for Tab Kiểm Kê (Objective 5)
  const filteredChecks = useMemo(() => {
    return checks.filter((c) => {
      if (checkCategoryFilter !== 'ALL') {
        const matchCat = (c.items || []).some((it) => {
          const found = buffetItems.find((b) => b.id === it.itemId);
          return (found?.category || '').toLowerCase().includes(checkCategoryFilter.toLowerCase());
        });
        if (!matchCat) return false;
      }

      if (checkHighValueOnly) {
        const matchHighValue = (c.items || []).some((it) => {
          const found = buffetItems.find((b) => b.id === it.itemId);
          return isHighValueItem({
            itemCode: it.itemCode,
            itemName: it.itemName,
            costPrice: found?.costPrice,
          });
        });
        if (!matchHighValue) return false;
      }

      return true;
    });
  }, [checks, checkCategoryFilter, checkHighValueOnly, buffetItems]);

  // Calculate Loss Report stats
  const totalImportedKg = lossReports.reduce(
    (s, r) => s + Number(r.totalPurchasedQty ?? r.importedQuantity ?? 0),
    0
  );
  const totalDamagedKg = lossReports.reduce(
    (s, r) => s + Number(r.totalDamagedQty ?? r.damagedQuantity ?? 0),
    0
  );
  const avgLossRate = totalImportedKg > 0 ? (totalDamagedKg / totalImportedKg) * 100 : 0;
  const highRiskSuppliersCount = lossReports.filter(
    (r) => Number(r.damageRatePercentage ?? r.lossRate ?? 0) > 5.0
  ).length;

  // ─────────────────────────────────────────────────────────────
  // KPI BENTO CARDS METRICS COMPUTATION (COCKPIT KHO)
  // ─────────────────────────────────────────────────────────────
  // 1. Tổng tồn kho khả dụng (kg)
  const totalStockKg = useMemo(() => {
    if (batches && batches.length > 0) {
      return batches.reduce((sum, b) => sum + (Number(b.currentStock) || 0), 0);
    }
    return stocks.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  }, [batches, stocks]);

  // 2. Cảnh báo cận hạn / sắp hết
  const alertBatchCount = useMemo(() => {
    return batches.filter((b) => {
      const exp = getExpiryInfo(b.expiryDate);
      const stock = getStockInfo(b.currentStock, b.initialQuantity);
      return (
        exp.status === 'expired' ||
        exp.status === 'warning' ||
        stock.status === 'empty' ||
        stock.status === 'low'
      );
    }).length;
  }, [batches]);

  // 3. Phiếu xuất hủy chờ duyệt (có badge đỏ cảnh báo quản lý)
  const pendingWasteDocs = useMemo(() => {
    return documents.filter(
      (d) =>
        (d.docType === 'HUY' || (d as any).type === 'HUY') &&
        (d.status === 'CHO_DUYET' || d.status === 'PENDING')
    );
  }, [documents]);
  const pendingWasteDocCount = pendingWasteDocs.length;

  // 4. Lệch cân NCC cần phạt
  const shortageWeightDocs = useMemo(() => {
    return documents.filter((d) => {
      if (d.docType !== 'NHAP') return false;
      const invW = Number((d as any).totalWeight || (d as any).invoiceWeight || 0);
      const actW = Number((d as any).actualWeight || 0);
      if (invW > 0 && actW > 0 && invW - actW > 0.2) return true;
      if (
        d.items &&
        d.items.some(
          (it: any) =>
            (Number(it.weightDiff) || 0) < -0.2 || (Number(it.shortageAmount) || 0) > 0
        )
      ) {
        return true;
      }
      return false;
    });
  }, [documents]);
  const weightShortageCount = shortageWeightDocs.length;

  const totalWeightShortageKg = useMemo(() => {
    return documents.reduce((sum, d) => {
      if (d.docType !== 'NHAP') return sum;
      let diff = 0;
      if (d.items) {
        d.items.forEach((it: any) => {
          const dKg = Number(it.weightDiff) || 0;
          if (dKg < -0.1) diff += Math.abs(dKg);
        });
      }
      return sum + diff;
    }, 0);
  }, [documents]);

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* HEADER BANNER & BREADCRUMB                                         */}
      {/* =================================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-sm mb-2 border border-indigo-500/30">
              <Boxes className="h-3.5 w-3.5" />
              <span>Phân Hệ Quản Trị Kho Vận & Kiểm Soát Thất Thoát NCC</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>QUẢN TRỊ KHO, LÔ NHẬP & CÔNG NỢ NHÀ CUNG CẤP</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Chi nhánh: <span className="font-bold text-amber-400">{user?.branchName || 'Chi nhánh Thái Nguyên (TN)'}</span> |
              Cân điện tử 2 cột SL, Thẻ kho tức thời, Đối soát công nợ 5-10 ngày & Phiếu hủy chống xuất âm
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Nút Cân Hàng Mới Về - Tự động nổi bật đối với Bếp viên */}
            <button
              onClick={() => handleOpenDocModal('NHAP')}
              className={`btn-touch rounded-xl font-black text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all ${
                isKitchenPure
                  ? 'px-5 py-3 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-sm shadow-emerald-500/40 ring-4 ring-emerald-400/30 animate-pulse'
                  : 'px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <Scale className={`h-4 w-4 ${isKitchenPure ? 'h-5 w-5 text-emerald-950' : 'text-slate-950'}`} />
              <span>⚖️ CÂN HÀNG MỚI VỀ</span>
            </button>

            {!isKitchenPure && (
              <button
                onClick={() => handleOpenDocModal('NHAP')}
                className="btn-touch px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
              >
                <PackagePlus className="h-4 w-4" />
                <span>+ NHẬP KHO</span>
              </button>
            )}

            <button
              onClick={() => handleOpenDocModal('HUY')}
              className="btn-touch px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              <span>{isKitchenPure ? '+ BÁO HỦY KHO' : '+ XUẤT HỦY KHO'}</span>
            </button>

            <button
              onClick={handleOpenCheckModal}
              className="btn-touch px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
            >
              <ClipboardCheck className="h-4 w-4" />
              <span>KIỂM KÊ CA</span>
            </button>
          </div>
        </div>

        {/* TOP TAB NAVIGATION - 4 NHÓM NGHIỆP VỤ COCKPIT CHUẨN */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800 pt-4 overflow-x-auto no-scrollbar">
          {/* TAB 1: STOCK OVERVIEW */}
          <button
            onClick={() => setActiveTab('stock-overview')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'stock-overview'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Boxes className="h-4 w-4" />
            <span>1. Tồn Kho & Thẻ Kho Vật Lý</span>
            {alertBatchCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
                {alertBatchCount}
              </span>
            )}
          </button>

          {/* TAB 2: DOCUMENTS */}
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'documents'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>2. Chứng Từ Nhập - Xuất - Hủy ({documents.length})</span>
            {pendingWasteDocCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black animate-pulse">
                {pendingWasteDocCount} chờ duyệt
              </span>
            )}
          </button>

          {/* TAB 3: INVENTORY CHECK */}
          <button
            onClick={() => setActiveTab('inventory-check')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'inventory-check'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>3. Kiểm Kê Kho Định Kỳ ({checks.length})</span>
          </button>

          {/* TAB 4: SUPPLIER PARTNER */}
          <button
            onClick={() => setActiveTab('supplier-partner')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'supplier-partner'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40 ring-2 ring-amber-300'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Scale className="h-4 w-4" />
            <span>4. Đối Soát & Nhà Cung Cấp ({suppliers.length} NCC)</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          HÀNG KPI BENTO CARDS COCKPIT KHO (4 CHỈ SỐ THEN CHỐT)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng Tồn Khả Dụng */}
        <div
          onClick={() => {
            setActiveTab('stock-overview');
            setStockSubTab('cards');
          }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Tổng Tồn Khả Dụng
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
              {totalStockKg.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
            </span>
            <span className="text-xs font-bold text-slate-500">kg thực tế</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">5 phân vùng kho</span>
            {isKitchenPure ? (
              <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                ✓ Bếp sẵn sàng dùng
              </span>
            ) : (
              <span className="font-semibold text-emerald-600">
                {stocks.length} mặt hàng
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Cảnh Báo Cận Hạn / Sắp Hết */}
        <div
          onClick={() => {
            setActiveTab('stock-overview');
            setStockSubTab('batches');
            setBatchStockFilter('LOW');
          }}
          className={`bg-white p-4 sm:p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group ${
            alertBatchCount > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Cận Hạn / Sắp Hết
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                alertBatchCount > 0 ? 'text-amber-700' : 'text-slate-900'
              }`}
            >
              {alertBatchCount}
            </span>
            <span className="text-xs font-bold text-slate-500">lô cần chú ý</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Ngưỡng &le;25% &amp; FEFO</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-md ${
                alertBatchCount > 0
                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                  : 'text-slate-400'
              }`}
            >
              {alertBatchCount > 0 ? 'Cần nhập bổ sung' : 'Tồn ổn định'}
            </span>
          </div>
        </div>

        {/* Card 3: Phiếu Xuất Hủy Chờ Duyệt (Cảnh Báo Quản Lý) */}
        <div
          onClick={() => {
            setActiveTab('documents');
            setDocTypeFilter('HUY');
          }}
          className={`p-4 sm:p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group ${
            pendingWasteDocCount > 0
              ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-400/30'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Xuất Hủy Chờ Duyệt
            </span>
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center font-black group-hover:scale-110 transition-transform ${
                pendingWasteDocCount > 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-rose-100 text-rose-700'
              }`}
            >
              <Trash2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                pendingWasteDocCount > 0 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {pendingWasteDocCount}
            </span>
            <span className="text-xs font-bold text-slate-500">phiếu hủy</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Chống xuất âm kho</span>
            {pendingWasteDocCount > 0 ? (
              <span className="inline-flex items-center gap-1 font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300 animate-pulse">
                <ShieldAlert className="h-3 w-3" />
                <span>QUẢN LÝ CẦN DUYỆT</span>
              </span>
            ) : (
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Đã duyệt hết
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Lệch Cân NCC Cần Phạt */}
        <div
          onClick={() => {
            setActiveTab('supplier-partner');
            setSupplierSubTab('recon');
          }}
          className={`p-4 sm:p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group ${
            weightShortageCount > 0 ? 'bg-indigo-50/40 border-indigo-200' : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Lệch Cân NCC Cần Phạt
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
              <Scale className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                weightShortageCount > 0 ? 'text-indigo-900' : 'text-slate-900'
              }`}
            >
              {weightShortageCount}
            </span>
            <span className="text-xs font-bold text-slate-500">đợt giao lệch</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">
              Hụt {totalWeightShortageKg.toFixed(1)} kg thực tế
            </span>
            <span className="font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md border border-indigo-200">
              {isKitchenPure ? 'Đã ghi biên bản' : 'Trừ công nợ'}
            </span>
          </div>
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {notice && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{notice.text}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 1: 📦 TỒN KHO & THẺ KHO VẬT LÝ (STOCK OVERVIEW COCKPIT)         */}
      {/* =================================================================== */}
      {activeTab === 'stock-overview' && (
        <div className="space-y-4">
          {/* Sub-tab navigation bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStockSubTab('cards')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  stockSubTab === 'cards'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Package className="h-3.5 w-3.5" />
                <span>Thẻ Kho & 5 Phân Vùng Vật Lý</span>
              </button>
              <button
                type="button"
                onClick={() => setStockSubTab('batches')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  stockSubTab === 'batches'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Tag className="h-3.5 w-3.5" />
                <span>Quản Lý Lô Hàng & Hạn Dùng FEFO ({batches.length})</span>
                {alertBatchCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
                    {alertBatchCount}
                  </span>
                )}
              </button>
            </div>
            {isKitchenPure && (
              <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-emerald-600" />
                <span>Chế độ Bếp viên: Ẩn giá nhạy cảm • Ưu tiên số lượng tồn khả dụng (kg)</span>
              </div>
            )}
          </div>

          {stockSubTab === 'cards' ? (
            <StockCardsTab
              stocks={stocks}
              batches={batches}
              buffetItems={buffetItems}
              documents={documents}
              onOpenDocModal={handleOpenDocModal}
              hideFinancials={hideFinancials}
            />
          ) : (
            <div className="space-y-4">
              {/* Thanh công cụ Tìm kiếm & Lọc NCC & Lọc Tồn kho */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm mã lô hoặc tên hàng..."
                      value={batchSearchTerm}
                      onChange={(e) => {
                        setBatchSearchTerm(e.target.value);
                        setBatchPage(1);
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Lọc NCC */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <select
                      value={batchSupplierFilter}
                      onChange={(e) => {
                        setBatchSupplierFilter(e.target.value);
                        setBatchPage(1);
                      }}
                      className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ALL">Tất cả NCC ({suppliers.length})</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.supplierCode || s.supplierName}>
                          {s.supplierName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lọc Tình Trạng Tồn Kho */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <select
                      value={batchStockFilter}
                      onChange={(e) => {
                        setBatchStockFilter(e.target.value as any);
                        setBatchPage(1);
                      }}
                      className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ALL">Tất cả mức tồn</option>
                      <option value="SAFE">🟢 Tồn an toàn (&gt;25%)</option>
                      <option value="LOW">🟡 Sắp hết (&le;25%)</option>
                      <option value="EMPTY">🔴 Đã hết (0%)</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
                  <span>
                    Đang hiển thị: <strong className="text-indigo-600">{filteredBatches.length}</strong> / {batches.length} lô
                  </span>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-extrabold text-[11px] uppercase tracking-wider">
                        <th className="p-3.5">Mã Lô (LOT)</th>
                        <th className="p-3.5">Mặt Hàng / Nguyên Liệu</th>
                        <th className="p-3.5">Nhà Cung Cấp</th>
                        <th className="p-3.5 text-right">Lượng Ban Đầu</th>
                        <th className="p-3.5 text-right">Tồn Hiện Tại</th>
                        <th className="p-3.5 text-center">Tỷ Lệ Tồn</th>
                        <th className="p-3.5">Hạn Sử Dụng (FEFO)</th>
                        <th className="p-3.5 text-right font-mono">{isKitchenPure ? 'Trạng Thái' : 'Đơn Giá'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {paginatedBatches.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            Không tìm thấy lô hàng nào phù hợp với bộ lọc
                          </td>
                        </tr>
                      ) : (
                        paginatedBatches.map((batch) => {
                          const stock = getStockInfo(batch.currentStock, batch.initialQuantity);
                          const expiry = getExpiryInfo(batch.expiryDate);

                          return (
                            <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3.5 font-mono font-bold text-indigo-700">{batch.batchCode}</td>
                              <td className="p-3.5 font-bold text-slate-900">
                                {batch.itemName || batch.itemCode}
                                <div className="text-[10px] text-slate-400 font-normal">
                                  Nhập ngày: {batch.importDate}
                                </div>
                              </td>
                              <td className="p-3.5 font-medium text-slate-700">
                                {batch.supplierName || batch.supplierCode || 'Nội bộ'}
                              </td>
                              <td className="p-3.5 text-right font-mono text-slate-600">
                                {batch.initialQuantity} {batch.unit}
                              </td>
                              <td className="p-3.5 text-right font-mono font-black text-slate-900">
                                {batch.currentStock} {batch.unit}
                              </td>
                              <td className="p-3.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stock.badgeClass}`}>
                                  {stock.label}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${expiry.colorClass}`}>
                                  {expiry.label}
                                </span>
                              </td>
                              <td className="p-3.5 text-right font-mono">
                                {hideFinancials ? (
                                  <span className="text-slate-400 text-xs italic">*** (Bảo mật)</span>
                                ) : (
                                  `${Number(batch.unitPrice).toLocaleString('vi-VN')} đ`
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: 📑 CHỨNG TỪ NHẬP - XUẤT - HỦY (DOCUMENTS COCKPIT)            */}
      {/* =================================================================== */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {/* Action & Flexible Filter Bar (4 Tiêu Chí: Chi Nhánh, Ngày, NCC, Loại Phiếu) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* 1. Bộ lọc Loại Phiếu */}
                <div className="flex items-center gap-1 overflow-x-auto">
                  <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Loại:</span>
                  {(['ALL', 'NHAP', 'HUY', 'XUAT_CHUYEN'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setDocTypeFilter(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        docTypeFilter === type
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {type === 'ALL'
                        ? 'Tất cả'
                        : type === 'NHAP'
                        ? '📥 Nhập kho'
                        : type === 'HUY'
                        ? '🗑️ Xuất huỷ'
                        : '🔄 Xuất chuyển'}
                    </button>
                  ))}
                </div>

                {/* 2. Bộ lọc Chi Nhánh */}
                <div className="flex items-center gap-1 text-xs">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <select
                    value={docBranchFilter}
                    onChange={(e) => setDocBranchFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                  >
                    <option value="ALL">Tất cả chi nhánh</option>
                    <option value="1">Chi nhánh Thái Nguyên (TN)</option>
                    <option value="2">Chi nhánh Quế Võ (QV)</option>
                  </select>
                </div>

                {/* 3. Bộ lọc Nhà Cung Cấp */}
                <div className="flex items-center gap-1 text-xs">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <select
                    value={docSupplierFilter}
                    onChange={(e) => setDocSupplierFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                  >
                    <option value="ALL">Tất cả NCC ({suppliers.length})</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.supplierName} ({s.supplierCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Bộ lọc Khoảng Ngày */}
                <div className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={docDateFrom}
                    onChange={(e) => setDocDateFrom(e.target.value)}
                    className="h-8 px-2 rounded-lg border border-slate-200 text-xs font-mono"
                    title="Từ ngày"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="date"
                    value={docDateTo}
                    onChange={(e) => setDocDateTo(e.target.value)}
                    className="h-8 px-2 rounded-lg border border-slate-200 text-xs font-mono"
                    title="Đến ngày"
                  />
                  {(docDateFrom || docDateTo) && (
                    <button
                      type="button"
                      onClick={() => {
                        setDocDateFrom('');
                        setDocDateTo('');
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      title="Xóa lọc ngày"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Nút thao tác nhanh */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenDocModal('NHAP')}
                  className="btn-touch px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Lập Phiếu Nhập</span>
                </button>
                <button
                  onClick={() => handleOpenDocModal('XUAT_CHUYEN')}
                  className="btn-touch px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  title="Xuất dầu ăn, đường, gia vị từ Kho Khô sang Bếp"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  <span>+ Xuất Hàng Khô Sang Bếp</span>
                </button>
                <button
                  onClick={() => handleOpenDocModal('HUY')}
                  className="btn-touch px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>+ Lập Phiếu Huỷ</span>
                </button>
              </div>
            </div>

            {/* Ô tìm kiếm từ khóa */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="relative flex-1 max-w-sm">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm mã phiếu, người lập, tên hàng, ghi chú..."
                  value={docSearchTerm}
                  onChange={(e) => setDocSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="text-[11px] text-slate-500 font-semibold">
                Đang hiển thị: <strong className="text-indigo-600">{filteredDocs.length}</strong> / {documents.length} phiếu
              </div>
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2" />
                <span>Đang tải danh sách phiếu kho...</span>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <Boxes className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold">Chưa có chứng từ kho nào phù hợp với bộ lọc</p>
                <p className="text-xs mt-1">Bấm nút "Lập Phiếu Nhập" để nhập lô hàng mới từ nhà cung cấp</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                      <th className="p-3.5">Mã Phiếu</th>
                      <th className="p-3.5">Loại</th>
                      <th className="p-3.5">Chi Nhánh</th>
                      <th className="p-3.5">Nhà Cung Cấp / Đối Tác</th>
                      <th className="p-3.5">Số Mặt Hàng</th>
                      <th className="p-3.5 text-right">Tổng Khối Lượng</th>
                      <th className="p-3.5 text-right font-mono">{isKitchenPure ? 'Giá Trị' : 'Tổng Giá Trị'}</th>
                      <th className="p-3.5">Người Lập</th>
                      <th className="p-3.5">Thời Gian</th>
                      <th className="p-3.5 text-center">Ảnh CT</th>
                      <th className="p-3.5 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredDocs.map((doc) => {
                      const imageList = doc.imageUrls ? doc.imageUrls.split(';').filter(Boolean) : [];
                      const totalQty = (doc.items || []).reduce(
                        (sum, it) => sum + (it.actualWeight ?? it.quantity ?? 0),
                        0
                      );

                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-indigo-700">{doc.docCode}</td>
                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                doc.docType === 'NHAP'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : doc.docType === 'HUY'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {doc.docType === 'NHAP'
                                ? '📥 Nhập kho'
                                : doc.docType === 'HUY'
                                ? '🗑️ Xuất huỷ'
                                : '🔄 Xuất chuyển'}
                            </span>
                          </td>
                          <td className="p-3.5 font-medium text-slate-700">
                            {doc.branchId === 2 ? 'Quế Võ (QV)' : 'Thái Nguyên (TN)'}
                          </td>
                          <td className="p-3.5 font-semibold text-slate-900">
                            {doc.supplierName || doc.supplierCode || 'Nội bộ chi nhánh'}
                          </td>
                          <td className="p-3.5 font-medium">{doc.items ? doc.items.length : 0} món</td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                            {totalQty.toFixed(1)} kg
                          </td>
                          <td className="p-3.5 text-right font-mono font-black text-slate-900">
                            {isKitchenPure ? (
                              <span className="text-slate-400 text-xs italic">*** (Bảo mật)</span>
                            ) : (
                              `${Number(doc.totalAmount || 0).toLocaleString('vi-VN')} đ`
                            )}
                          </td>
                          <td className="p-3.5 text-slate-600">{doc.createdBy || 'Bếp trưởng'}</td>
                          <td className="p-3.5 text-slate-500 font-mono text-xs">
                            {doc.createdAt
                              ? new Date(doc.createdAt).toLocaleString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit',
                                })
                              : '--'}
                          </td>

                          {/* ẢNH CHỨNG TỪ: CLICK THUMBNAIL MỞ FULL HD MODAL */}
                          <td className="p-3.5 text-center">
                            {imageList.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleOpenHDImage(imageList, 0, doc.docCode)}
                                className="group relative inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all hover:scale-105 border border-indigo-200"
                                title="Bấm để xem ảnh chứng từ HD phóng to"
                              >
                                <Camera className="h-3.5 w-3.5" />
                                <span>{imageList.length} ảnh HD</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">--</span>
                            )}
                          </td>

                          {/* THAO TÁC: PHÊ DUYỆT (KHO-06) / XEM CHI TIẾT & IN BIÊN BẢN A4 */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* KHO-06: Phân quyền duyệt xuất hủy */}
                              {doc.docType === 'HUY' && (
                                <>
                                  {doc.status === 'CHO_DUYET' ? (
                                    canApproveWaste ? (
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleApproveDoc(doc)}
                                          className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-0.5 shadow-sm transition-all"
                                          title="Quản lý phê duyệt xuất hủy - trừ tồn kho chính thức"
                                        >
                                          <Check className="h-3 w-3" />
                                          <span>Duyệt Hủy</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRejectDoc(doc)}
                                          className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold inline-flex items-center gap-0.5 shadow-sm transition-all"
                                          title="Từ chối yêu cầu xuất hủy"
                                        >
                                          <X className="h-3 w-3" />
                                          <span>Từ Chối</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                        🟡 Đang chờ Quản lý duyệt
                                      </span>
                                    )
                                  ) : doc.status === 'DA_DUYET' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      ✅ Đã duyệt
                                    </span>
                                  ) : doc.status === 'TU_CHOI' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                      ❌ Đã từ chối
                                    </span>
                                  ) : null}
                                </>
                              )}

                              {doc.docType === 'NHAP' && (
                                <button
                                  type="button"
                                  onClick={() => setViewingVoucherDoc(doc)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center gap-1 transition-all"
                                  title="In / Xem Phiếu Giao Nhận A4 Chuẩn Hóa"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                  <span>In A4</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setViewingDoc(doc)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1 transition-all"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Xem</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: 📋 KIỂM KÊ KHO ĐỊNH KỲ (INVENTORY CHECK COCKPIT)             */}
      {/* =================================================================== */}
      {/* =================================================================== */}
      {activeTab === 'inventory-check' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
            <ClipboardCheck className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900">
              <strong className="font-bold">Quy Chuẩn Chống Thất Thoát Bằng Kiểm Kê Ca (Chị Thêm Yêu Cầu):</strong>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Nhân viên kiểm kê nhập số lượng thực tế đếm được. Mọi chênh lệch giữa Tồn Hệ Thống và Tồn Thực Tế
                bắt buộc phải có lý do giải trình. Bếp ca trưởng có thể bật toggle{' '}
                <strong>"💎 Chỉ kiểm hàng đắt tiền/nhạy cảm"</strong> để chốt nhanh 5-7 món chủ lực (Cua, Ghẹ, Tôm, Bò) trong 3 phút cuối ca.
              </p>
            </div>
          </div>

          {/* Controls & Filter Toolbar cho Kiểm Kê */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Lọc nhóm kiểm kê:</span>
              <select
                value={checkCategoryFilter}
                onChange={(e) => setCheckCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="ALL">Tất cả nhóm mặt hàng</option>
                <option value="hải sản">Hải sản tươi sống (Bể)</option>
                <option value="bò">Thịt bò nhập khẩu</option>
                <option value="thịt">Thịt heo / Thịt gà</option>
                <option value="rau">Rau củ / Nấm lẩu</option>
                <option value="khô">Gia vị / Đồ khô</option>
              </select>

              {/* Toggle Hàng Đắt Tiền / Nhạy Cảm (Objective 5) */}
              <button
                type="button"
                onClick={() => setCheckHighValueOnly(!checkHighValueOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  checkHighValueOnly
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>💎 Chỉ kiểm hàng đắt tiền / nhạy cảm</span>
              </button>
            </div>

            <button
              onClick={handleOpenCheckModal}
              className="btn-touch px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>+ Lập Biên Bản Kiểm Kê Ca</span>
            </button>
          </div>

          {/* Checks History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3.5">Mã Biên Bản</th>
                    <th className="p-3.5">Ca Làm Việc</th>
                    <th className="p-3.5">Ngày Kiểm Kê</th>
                    <th className="p-3.5">Người Kiểm Kê</th>
                    <th className="p-3.5">Số Mặt Hàng Lệch</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-right">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredChecks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Chưa có biên bản kiểm kê ca nào phù hợp với bộ lọc
                      </td>
                    </tr>
                  ) : (
                    filteredChecks.map((c) => {
                      const diffCount = c.items
                        ? c.items.filter((i) => Number(i.difference || 0) !== 0).length
                        : 0;
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-amber-700">{c.checkCode}</td>
                          <td className="p-3.5 font-bold">
                            {c.shift === 'CA_SANG' || c.shift === 'SANG'
                              ? '🌅 Ca Sáng (Đầu ca)'
                              : c.shift === 'CA_TOI' || c.shift === 'TOI'
                              ? '🌙 Ca Tối (Cuối ca)'
                              : '☀️ Cả ngày (Đột xuất)'}
                          </td>
                          <td className="p-3.5 font-mono text-slate-600">{c.checkDate}</td>
                          <td className="p-3.5 text-slate-900 font-medium">
                            {c.checkedByName || c.checkedBy || 'Bếp ca trưởng'}
                          </td>
                          <td className="p-3.5">
                            {diffCount > 0 ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                                {diffCount} món lệch tồn
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                Khớp 100%
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                              {c.status || 'ĐÃ LƯU'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setViewingCheck(c)}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Xem</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: 🤝 ĐỐI SOÁT & NHÀ CUNG CẤP (SUPPLIER PARTNER COCKPIT)         */}
      {/* =================================================================== */}
      {activeTab === 'supplier-partner' && (
        <div className="space-y-4">
          {/* Subtab Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto">
              {!isKitchenPure && (
                <button
                  type="button"
                  onClick={() => setSupplierSubTab('recon')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    supplierSubTab === 'recon'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Scale className="h-3.5 w-3.5" />
                  <span>Đối Soát Công Nợ NCC (5-10 ngày)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSupplierSubTab('loss-report')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  supplierSubTab === 'loss-report'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <TrendingDown className="h-3.5 w-3.5" />
                <span>Báo Cáo % Hỏng & Bắt Đền ({lossReports.length})</span>
                {highRiskSuppliersCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-600 text-white font-black animate-pulse">
                    {highRiskSuppliersCount} NCC rủi ro
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSupplierSubTab('suppliers')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  supplierSubTab === 'suppliers'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Danh Mục Đối Tác ({suppliers.length} NCC)</span>
              </button>
            </div>
          </div>

          {supplierSubTab === 'recon' && !isKitchenPure && (
            <SupplierDebtReconciliationTab
              suppliers={suppliers}
              documents={documents}
              onOpenDocModal={handleOpenDocModal}
              onViewVoucher={(doc) => setViewingVoucherDoc(doc)}
              branchId={user?.branchId || 1}
            />
          )}

          {supplierSubTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Danh Sách Đối Tác & Nhà Cung Cấp</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý thông tin nhà cung cấp phục vụ truy vết chất lượng và đối soát % hỏng
              </p>
            </div>
            <button
              onClick={() => handleOpenSupplierModal()}
              className="btn-touch px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Nhà Cung Cấp</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3.5">Mã NCC</th>
                    <th className="p-3.5">Tên Nhà Cung Cấp</th>
                    <th className="p-3.5">Số Điện Thoại</th>
                    <th className="p-3.5">Địa Chỉ Kho Hàng</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Chưa có Nhà cung cấp nào được cấu hình
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((sup) => (
                      <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-indigo-700">{sup.supplierCode}</td>
                        <td className="p-3.5 font-bold text-slate-900">{sup.supplierName}</td>
                        <td className="p-3.5 text-slate-600 flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{sup.phone || '--'}</span>
                        </td>
                        <td className="p-3.5 text-slate-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate max-w-xs">{sup.address || '--'}</span>
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sup.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {sup.status === 'ACTIVE' ? 'Đang hợp tác' : 'Tạm dừng'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleOpenSupplierModal(sup)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                          >
                            Chỉnh sửa
                          </button>
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

      {/* =================================================================== */}
      {/* TAB 7: BÁO CÁO % HỎNG THEO NHÀ CUNG CẤP                             */}
      {/* =================================================================== */}
      {supplierSubTab === 'loss-report' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Tháng</label>
                <select
                  value={reportMonth}
                  onChange={(e) => setReportMonth(Number(e.target.value))}
                  className="mt-0.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Năm</label>
                <select
                  value={reportYear}
                  onChange={(e) => setReportYear(Number(e.target.value))}
                  className="mt-0.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800"
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      Năm {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleExportLossExcel}
              disabled={isExportingExcel}
              className="btn-touch px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              {isExportingExcel ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>ĐANG XUẤT EXCEL...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>XUẤT BÁO CÁO EXCEL (POI)</span>
                </>
              )}
            </button>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Nhà Cung Cấp Giao</span>
              <div className="text-xl font-black font-mono text-slate-900 mt-1">{lossReports.length}</div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Đối tác trong tháng</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Tổng Nhập (kg)</span>
              <div className="text-xl font-black font-mono text-slate-900 mt-1">
                {totalImportedKg.toLocaleString('vi-VN')}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Hàng tươi sống & thực phẩm</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/50 shadow-sm">
              <span className="text-[11px] font-bold text-rose-700 uppercase">Tổng Hỏng Bắt Đền (kg)</span>
              <div className="text-xl font-black font-mono text-rose-700 mt-1">
                {totalDamagedKg.toLocaleString('vi-VN')}
              </div>
              <span className="text-[10px] text-rose-600 font-semibold mt-0.5 block">
                Tỷ lệ hỏng TB: {avgLossRate.toFixed(2)}%
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/50 shadow-sm">
              <span className="text-[11px] font-bold text-amber-800 uppercase">Cảnh Báo Vượt Ngưỡng (&gt;5%)</span>
              <div className="text-xl font-black font-mono text-amber-700 mt-1">
                {highRiskSuppliersCount}
              </div>
              <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">
                Cần phạt hợp đồng hoặc đổi NCC
              </span>
            </div>
          </div>

          {/* Loss Report Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3.5">Mã NCC</th>
                    <th className="p-3.5">Tên Nhà Cung Cấp</th>
                    <th className="p-3.5 text-right font-mono">Tổng Nhập (kg)</th>
                    <th className="p-3.5 text-right font-mono">Lượng Hỏng (kg)</th>
                    <th className="p-3.5 text-right font-mono font-bold">% Hỏng / Chết</th>
                    <th className="p-3.5 text-right font-mono">{isKitchenPure ? 'Ghi Chú' : 'Tiền Hàng (đ)'}</th>
                    <th className="p-3.5 text-right font-mono text-rose-700 font-black">{isKitchenPure ? 'Trạng Thái' : 'Tiền Bắt Đền (đ)'}</th>
                    <th className="p-3.5 text-center">Đánh Giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {lossReports.map((r, idx) => {
                    const rate = Number(r.damageRatePercentage ?? r.lossRate ?? 0);
                    const isHigh = rate > 5.0;

                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-indigo-700">{r.supplierCode}</td>
                        <td className="p-3.5 font-bold text-slate-900">{r.supplierName}</td>
                        <td className="p-3.5 text-right font-mono">{r.importedQuantity} kg</td>
                        <td className="p-3.5 text-right font-mono text-rose-600 font-bold">{r.damagedQuantity} kg</td>
                        <td
                          className={`p-3.5 text-right font-mono font-black ${
                            isHigh ? 'text-rose-600 text-sm' : 'text-slate-800'
                          }`}
                        >
                          {rate.toFixed(2)}%
                        </td>
                        <td className="p-3.5 text-right font-mono">
                          {isKitchenPure ? (
                            <span className="text-slate-400 text-xs italic">***</span>
                          ) : (
                            `${(Number(r.importedQuantity ?? r.totalPurchasedQty ?? 0) * 220000).toLocaleString('vi-VN')} đ`
                          )}
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-rose-700 bg-rose-50/50">
                          {isKitchenPure ? (
                            <span className="text-slate-400 text-xs italic">***</span>
                          ) : (
                            `${Number(r.damagedAmount ?? r.totalEstimatedLossAmount ?? 0).toLocaleString('vi-VN')} đ`
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {isHigh ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                              ⚠️ VƯỢT NGƯỠNG
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              ✓ Đạt chuẩn
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: TẠO PHIẾU NHẬP / XUẤT HUỶ KHO (TASK-PC-06: 2-COLUMN SPLIT-VIEW) */}
      {/* =================================================================== */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2 font-black text-base">
                {docType === 'NHAP' ? (
                  <div className="flex items-center gap-2 text-indigo-700">
                    <PackagePlus className="h-6 w-6" />
                    <span>LẬP PHIẾU NHẬP KHO & CÂN THỰC TẾ (2 CỘT SỐ LƯỢNG)</span>
                  </div>
                ) : docType === 'XUAT_CHUYEN' ? (
                  <div className="flex items-center gap-2 text-amber-700">
                    <ArrowRightLeft className="h-6 w-6" />
                    <span>LẬP PHIẾU XUẤT CHUYỂN NỘI BỘ (KHO KHÔ ➔ BẾP)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-700">
                    <Trash2 className="h-6 w-6" />
                    <span>LẬP PHIẾU BÁO HỎNG & XUẤT HỦY (4 NHÓM LÝ DO & BẮT ĐỀN NCC)</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-[11px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">
                  ESC để đóng
                </span>
                <button
                  onClick={() => setShowDocModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitDoc} className="flex-1 flex flex-col min-h-0 mt-3">
              <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* ========================================================= */}
                {/* CỘT TRÁI (60%): TOÀN BỘ FORM NHẬP LIỆU (lg:col-span-7)     */}
                {/* ========================================================= */}
                <div className="lg:col-span-7 space-y-3.5">
                  {docType === 'NHAP' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          CHỌN NHÀ CUNG CẤP GIAO HÀNG
                        </label>
                        <select
                          value={selectedSupplierId || ''}
                          onChange={(e) => setSelectedSupplierId(Number(e.target.value) || undefined)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.supplierName} ({s.supplierCode})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          VỊ TRÍ KHO VẬT LÝ LƯU TRỮ (KHO-11)
                        </label>
                        <select
                          value={selectedWarehouseLocation}
                          onChange={(e) => setSelectedWarehouseLocation(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-indigo-300 font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 bg-indigo-50/70"
                        >
                          {WAREHOUSE_LOCATIONS.filter((l) => l.id !== 'ALL').map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.icon} {loc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">GHI CHÚ / MỤC ĐÍCH</label>
                    <input
                      type="text"
                      placeholder={
                        docType === 'NHAP'
                          ? 'Ví dụ: Nhập 100kg cua Cà Mau tươi phục vụ line buffet ca tối...'
                          : 'Ví dụ: Hủy 3 con cua chết ngộp phát hiện khi giao nhận ca chiều...'
                      }
                      value={docNote}
                      onChange={(e) => setDocNote(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

              {/* LIST OF ITEMS ON DOCUMENT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    DANH SÁCH MẶT HÀNG TRÊN PHIẾU ({docItems.length} dòng)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddDocItem}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm Dòng</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {docItems.map((item, idx) => {
                    const avail = getAvailableStock(item.itemId, item.batchId);
                    const enteredQty =
                      typeof item.quantity === 'string'
                        ? parseFloat(item.quantity) || 0
                        : item.quantity || 0;
                    const isOverStock = docType === 'HUY' && enteredQty > avail.stock;
                    const availableBatchesForItem = batches.filter(
                      (b) => b.itemId === item.itemId && b.currentStock > 0
                    );

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border text-xs space-y-2.5 transition-all ${
                          isOverStock
                            ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/30'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        {/* HÀNG 1: CHỌN MÓN & CHỌN LÔ HÀNG */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className={docType === 'HUY' ? 'col-span-5' : 'col-span-3'}>
                            <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                              Nguyên liệu / Món ăn
                            </span>
                            <select
                              value={item.itemId}
                              onChange={(e) => handleDocItemChange(idx, 'itemId', e.target.value)}
                              className="w-full h-9 px-2 rounded-lg border border-slate-300 font-semibold text-slate-800 bg-white"
                            >
                              {buffetItems.map((bi) => (
                                <option key={bi.id} value={bi.id}>
                                  {bi.itemName} ({bi.unit})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Chọn Lô Hàng liên kết (cho phiếu hủy bắt đền NCC) */}
                          {docType === 'HUY' && (
                            <div className="col-span-4">
                              <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                                Liên kết Lô nhập (để bắt đền NCC)
                              </span>
                              <select
                                value={item.batchId || ''}
                                onChange={(e) =>
                                  handleDocItemChange(
                                    idx,
                                    'batchId',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="w-full h-9 px-2 rounded-lg border border-slate-300 font-mono text-[11px] text-slate-800 bg-white"
                              >
                                <option value="">-- Tất cả lô / Tự động trừ --</option>
                                {availableBatchesForItem.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.batchCode} (Tồn: {b.currentStock} {b.unit} • {b.supplierName || 'NCC'})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {docType === 'NHAP' ? (
                            <>
                              <div className="col-span-2">
                                <span className="text-[10px] text-amber-800 font-bold block mb-0.5">
                                  NCC Báo (kg)
                                </span>
                                <input
                                  type="number"
                                  step="any"
                                  min="0.001"
                                  placeholder="0.00"
                                  value={item.supplierReportedWeight ?? item.quantity}
                                  onChange={(e) =>
                                    handleDocItemChange(idx, 'supplierReportedWeight', e.target.value)
                                  }
                                  className="w-full h-9 px-2 rounded-lg border border-amber-300 font-bold bg-amber-50/70"
                                />
                              </div>

                              <div className="col-span-2">
                                <span className="text-[10px] text-indigo-800 font-bold block mb-0.5">
                                  Thực Cân (kg)
                                </span>
                                <input
                                  type="number"
                                  step="any"
                                  min="0.001"
                                  placeholder="0.00"
                                  value={item.actualWeight ?? item.quantity}
                                  onChange={(e) =>
                                    handleDocItemChange(idx, 'actualWeight', e.target.value)
                                  }
                                  className="w-full h-9 px-2 rounded-lg border border-indigo-400 font-black bg-indigo-50/70 text-indigo-950"
                                />
                              </div>
                            </>
                          ) : (
                            <div className="col-span-2">
                              <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                                Số lượng hủy
                              </span>
                              <input
                                type="number"
                                step="any"
                                min="0.001"
                                placeholder="0.00"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleDocItemChange(idx, 'quantity', e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === ',') {
                                    e.preventDefault();
                                    const cur = String(item.quantity ?? '');
                                    if (!cur.includes('.')) {
                                      handleDocItemChange(idx, 'quantity', (cur ? cur : '0') + '.');
                                    }
                                  }
                                }}
                                className={`w-full h-9 px-2 rounded-lg border font-bold ${
                                  isOverStock
                                    ? 'border-rose-500 bg-rose-50 text-rose-900 focus:ring-rose-500'
                                    : 'border-slate-300'
                                }`}
                              />
                            </div>
                          )}

                          {docType === 'NHAP' && !isKitchenPure && (
                            <div className="col-span-2">
                              <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                                Đơn giá (đ)
                              </span>
                              <input
                                type="number"
                                step="1000"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  handleDocItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                                }
                                className="w-full h-9 px-2 rounded-lg border border-slate-300 font-mono text-xs"
                              />
                            </div>
                          )}

                          {docType === 'NHAP' && (
                            <div className={isKitchenPure ? 'col-span-4' : 'col-span-2'}>
                              <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                                Hạn dùng
                              </span>
                              <input
                                type="date"
                                value={item.expiryDate}
                                onChange={(e) => handleDocItemChange(idx, 'expiryDate', e.target.value)}
                                className="w-full h-9 px-1 rounded-lg border border-slate-300 text-[11px]"
                              />
                            </div>
                          )}

                          <div className="col-span-1 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveDocItem(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                              disabled={docItems.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* OBJECTIVE 1: HIỂN THỊ TỒN KHẢ DỤNG & CẢNH BÁO VI PHẠM XUẤT ÂM KHO */}
                        {docType === 'HUY' && (
                          <div className="space-y-1.5 pt-1.5 border-t border-slate-200">
                            {/* Dòng tồn kho khả dụng hiện tại */}
                            <div className="flex items-center justify-between text-xs">
                              <div className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                                <span>📦 Tồn kho khả dụng hiện tại:</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full font-black font-mono ${
                                    avail.stock > 0
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {avail.stock.toFixed(2)} {avail.unit}
                                </span>
                                {item.batchId && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    (Lô: {avail.batchName})
                                  </span>
                                )}
                              </div>

                              {!isKitchenPure && (
                                <div className="text-slate-500 text-[11px]">
                                  Đơn giá: <strong>{item.unitPrice.toLocaleString('vi-VN')} đ</strong>
                                </div>
                              )}
                            </div>

                            {/* Báo đỏ vi phạm xuất âm kho */}
                            {isOverStock && (
                              <div className="p-2 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2 animate-pulse">
                                <ShieldAlert className="h-4 w-4 text-rose-600 flex-shrink-0" />
                                <span>
                                  ❌ VI PHẠM XUẤT ÂM KHO: Số lượng hủy ({enteredQty} {avail.unit}) vượt quá
                                  tồn kho khả dụng ({avail.stock} {avail.unit})! Hệ thống chặn lưu phiếu.
                                </span>
                              </div>
                            )}

                            {/* 4 NHÓM LÝ DO XUẤT HỦY CHUẨN KHO-04 */}
                            <div className="space-y-2 pt-1">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-600 block mb-0.5">
                                    Nhóm lý do hủy (4 nhóm quy chuẩn KHO-04)
                                  </span>
                                  <select
                                    value={item.lossCategory || 'HAI_SAN_CHET_NCC'}
                                    onChange={(e) =>
                                      handleDocItemChange(idx, 'lossCategory', e.target.value)
                                    }
                                    className="w-full h-9 px-2 rounded-lg border border-slate-300 font-bold text-xs bg-white"
                                  >
                                    <option value="HAI_SAN_CHET_NCC">
                                      1. Cua / Hải sản chết (Bắt đền NCC)
                                    </option>
                                    <option value="ME_CHE_BIEN_HONG">
                                      2. Mẻ chế biến bị hỏng (Cháy cháo, hỏng chè, hỏng kim chi) — Trách nhiệm Bếp
                                    </option>
                                    <option value="DO_TUOI_CUOI_NGAY">
                                      3. Đồ tươi thừa cuối ngày (Salad, đồ dùng trong ngày) — Hủy theo VSATTP
                                    </option>
                                    <option value="HAO_HUT_DAY_BUOC">
                                      4. Hao hụt dây buộc cua & Tiêu hao bóc tách
                                    </option>
                                  </select>
                                </div>

                                <div>
                                  <span className="text-[10px] font-bold text-slate-600 block mb-0.5">
                                    Ghi chú chi tiết lý do hủy
                                  </span>
                                  <input
                                    type="text"
                                    placeholder="Ví dụ: Cua chết ngộp 3 con khi rã đông, bắt đền NCC..."
                                    value={item.reasonDetail || ''}
                                    onChange={(e) =>
                                      handleDocItemChange(idx, 'reasonDetail', e.target.value)
                                    }
                                    className="w-full h-9 px-2 rounded-lg border border-slate-300 text-xs"
                                  />
                                </div>
                              </div>

                              {/* BẮT BUỘC CHỌN NCC & LÔ NHẬP ĐỂ BẮT ĐỀN KHI CHỌN NHÓM CUA / HẢI SẢN CHẾT */}
                              {item.lossCategory === 'HAI_SAN_CHET_NCC' && (
                                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-300 space-y-2">
                                  <div className="text-[11px] text-amber-900 font-bold flex items-center gap-1.5">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                    <span>
                                      Truy xét trách nhiệm NCC: Khoản tổn thất này sẽ được liên kết Lô để bắt đền và cấn trừ vào công nợ NCC!
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-[10px] font-bold text-amber-950 block mb-0.5">
                                        Nhà cung cấp chịu trách nhiệm (*)
                                      </span>
                                      <select
                                        value={selectedSupplierId || ''}
                                        onChange={(e) =>
                                          setSelectedSupplierId(Number(e.target.value) || undefined)
                                        }
                                        className="w-full h-8 px-2 rounded-lg border border-amber-300 font-bold text-xs bg-white text-slate-800"
                                      >
                                        <option value="">-- Chọn Nhà Cung Cấp Bắt Đền --</option>
                                        {suppliers.map((s) => (
                                          <option key={s.id} value={s.id}>
                                            {s.supplierName} ({s.supplierCode})
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <span className="text-[10px] font-bold text-amber-950 block mb-0.5">
                                        Lô nhập gốc để trừ tồn & truy vết
                                      </span>
                                      <select
                                        value={item.batchId || ''}
                                        onChange={(e) =>
                                          handleDocItemChange(
                                            idx,
                                            'batchId',
                                            e.target.value ? Number(e.target.value) : undefined
                                          )
                                        }
                                        className="w-full h-8 px-2 rounded-lg border border-amber-300 font-mono text-[11px] bg-white text-slate-800"
                                      >
                                        <option value="">-- Tự động trừ lô gần nhất --</option>
                                        {availableBatchesForItem.map((b) => (
                                          <option key={b.id} value={b.id}>
                                            {b.batchCode} ({b.supplierName || 'NCC'} • Tồn: {b.currentStock} {b.unit})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Chi tiết cân lệch và tự động khấu trừ tiền thiếu (PHIẾU NHẬP) */}
                        {docType === 'NHAP' && (
                          <div className="flex flex-wrap items-center justify-between pt-1.5 border-t border-slate-200 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-500">
                                Lệch (Thực cân - NCC báo):
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full font-black ${
                                  (item.weightDiff || 0) < 0
                                    ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                                    : (item.weightDiff || 0) > 0
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {(item.weightDiff || 0) > 0
                                  ? `+${item.weightDiff}`
                                  : item.weightDiff || 0}{' '}
                                kg
                              </span>
                              {(item.weightDiff || 0) < 0 && (
                                <span className="text-rose-600 font-bold ml-1">
                                  ⚠️ Cân thiếu {Math.abs(item.weightDiff || 0)} kg — Giảm trừ:{' '}
                                  <strong className="text-rose-700">
                                    -{(item.shortageAmount || 0).toLocaleString('vi-VN')} đ
                                  </strong>
                                </span>
                              )}
                            </div>
                            {!isKitchenPure && (
                              <div className="font-bold text-slate-700">
                                Thực tính phiếu:{' '}
                                <strong className="text-indigo-700 font-mono">
                                  {(
                                    (Number(item.actualWeight || item.quantity) || 0) *
                                    (Number(item.unitPrice) || 0)
                                  ).toLocaleString('vi-VN')}{' '}
                                  đ
                                </strong>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

              {/* ========================================================= */}
              {/* CỘT PHẢI (40%): ẢNH HÓA ĐƠN + BẢNG TỔNG KẾT (lg:col-span-5) */}
              {/* ========================================================= */}
              <div className="lg:col-span-5 flex flex-col space-y-3.5">
                {/* CARD 1: ẢNH CHỨNG TỪ / BÀN CÂN CỠ LỚN WIDESCREEN */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <Camera className="h-4 w-4 text-indigo-600" />
                      <span>ẢNH HÓA ĐƠN / BÀN CÂN ({docImages.length})</span>
                      <span className="text-rose-600 font-black">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => docFileInputRef.current?.click()}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-indigo-200 shadow-xs"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Chụp/Tải ảnh</span>
                    </button>
                  </div>

                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    capture="environment"
                    ref={docFileInputRef}
                    onChange={handleDocPhotoUpload}
                    className="hidden"
                  />

                  {/* Khung xem ảnh lớn trực tiếp song song với Form */}
                  {docImages.length > 0 ? (
                    <div className="space-y-2">
                      <div className="h-52 sm:h-60 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden relative flex items-center justify-center group shadow-inner">
                        <img
                          src={docImages[activeDocImgIndex]?.dataUrl || docImages[0]?.dataUrl}
                          alt="HD Voucher Large Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = docImages.filter((_, idx) => idx !== activeDocImgIndex);
                              setDocImages(newImages);
                              if (activeDocImgIndex >= newImages.length && newImages.length > 0) {
                                setActiveDocImgIndex(newImages.length - 1);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-black/70 hover:bg-rose-600 text-white transition-colors"
                            title="Xóa ảnh này"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="absolute bottom-1.5 left-2 bg-black/70 backdrop-blur-xs text-[10px] text-white px-2 py-0.5 rounded font-mono">
                          Ảnh {activeDocImgIndex + 1}/{docImages.length} • {docImages[activeDocImgIndex]?.compressedSizeKb || docImages[0]?.compressedSizeKb} KB
                        </div>
                      </div>

                      {/* Thumbnail Strip */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {docImages.map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActiveDocImgIndex(i)}
                            className={`relative flex-shrink-0 h-14 w-14 rounded-lg overflow-hidden border-2 transition-all ${
                              activeDocImgIndex === i
                                ? 'border-indigo-600 ring-2 ring-indigo-400/50 scale-105'
                                : 'border-slate-300 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={img.dataUrl} alt={`Thumb ${i}`} className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => docFileInputRef.current?.click()}
                      className="h-48 sm:h-56 rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/70 text-slate-500 hover:text-indigo-700 flex flex-col items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer p-4 text-center group"
                    >
                      <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <Camera className="h-6 w-6" />
                      </div>
                      <span className="font-extrabold text-indigo-900 text-xs sm:text-sm">
                        Bấm để tải ảnh Hóa đơn / Bàn cân
                      </span>
                      <span className="text-[11px] text-slate-500 font-normal max-w-xs">
                        Ảnh sẽ hiển thị ngay tại cột này để bạn vừa nhìn vừa nhập liệu song song
                      </span>
                    </button>
                  )}
                </div>

                {/* CARD 2: TÓM TẮT TÀI CHÍNH & KHẤU TRỪ */}
                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    {docType === 'NHAP' ? 'TỔNG HỢP TÍNH TIỀN PHIẾU NHẬP' : 'TỔNG GIÁ TRỊ XUẤT HỦY'}
                  </span>

                  {docType === 'NHAP' ? (
                    isKitchenPure ? (
                      <div className="p-3 bg-emerald-50 rounded-xl space-y-1 text-xs border border-emerald-200">
                        <div className="flex justify-between items-center text-emerald-900 font-bold">
                          <span>Tổng khối lượng thực nhận (kg):</span>
                          <span className="font-mono text-base font-black text-emerald-700">
                            {docItems.reduce((acc, it) => acc + (Number(it.actualWeight || it.quantity) || 0), 0).toFixed(1)} kg
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-700">
                          ✓ Bếp viên ghi nhận khối lượng thực tế cân bàn. Công nợ và khấu trừ do Kế toán & Quản lý phụ trách.
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Tổng tiền hóa đơn theo NCC báo:</span>
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {calculateDocTotals().totalReported.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                        {calculateDocTotals().totalShortage > 0 && (
                          <div className="flex justify-between items-center text-rose-700 font-bold bg-rose-50 p-2 rounded-xl border border-rose-200">
                            <span className="flex items-center gap-1">
                              <MinusCircle className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" />
                              <span>Giảm trừ công nợ (cân thiếu):</span>
                            </span>
                            <span className="font-mono text-rose-700 font-black">
                              -{calculateDocTotals().totalShortage.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-300 text-sm font-extrabold text-slate-900">
                          <span className="text-indigo-950">Phải trả NCC thực tế:</span>
                          <span className="text-indigo-700 font-mono text-lg font-black">
                            {calculateDocTotals().finalPayable.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </>
                    )
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center pt-1 text-sm font-extrabold text-slate-900">
                        <span>Tổng giá trị hàng hủy:</span>
                        <span className="text-rose-700 font-mono text-lg font-black">
                          {calculateDocTotals().finalPayable.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 italic bg-white/70 p-2 rounded-lg border border-slate-200">
                        ℹ️ Phiếu hủy sẽ được chuyển đến Bếp trưởng & Quản lý duyệt trước khi trừ sổ kho.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS (BOTTOM FOOTER) */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 mt-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="btn-touch h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDoc}
                  className={`btn-touch h-12 rounded-xl font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 ${
                    docType === 'HUY'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                      : docType === 'XUAT_CHUYEN'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                  }`}
                >
                  {isSubmittingDoc ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>ĐANG LƯU PHIẾU...</span>
                    </>
                  ) : docType === 'HUY' ? (
                    <span>XÁC NHẬN GỬI BÁO HỎNG (CHỜ DUYỆT)</span>
                  ) : docType === 'XUAT_CHUYEN' ? (
                    <span>XÁC NHẬN XUẤT HÀNG SANG BẾP</span>
                  ) : (
                    <span>XÁC NHẬN LƯU PHIẾU NHẬP</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: XEM CHI TIẾT PHIẾU KHO                                      */}
      {/* =================================================================== */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-700 font-black text-base">
                <Eye className="h-5 w-5" />
                <span>CHI TIẾT PHIẾU: {viewingDoc.docCode}</span>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[11px]">Loại phiếu</span>
                  <span className="font-bold text-slate-800">{viewingDoc.docType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Nhà cung cấp</span>
                  <span className="font-bold text-slate-800">
                    {viewingDoc.supplierName || viewingDoc.supplierCode || 'Nội bộ'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Người tạo</span>
                  <span className="font-bold text-slate-800">{viewingDoc.createdBy}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Ngày tạo</span>
                  <span className="font-mono text-slate-800">{viewingDoc.createdAt}</span>
                </div>
              </div>

              {viewingDoc.note && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">Ghi chú</span>
                  <p className="text-slate-700 font-medium">{viewingDoc.note}</p>
                </div>
              )}

              {/* Items List */}
              <div>
                <span className="font-bold text-slate-700 block mb-2">Chi Tiết Mặt Hàng:</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-600">
                      <tr>
                        <th className="p-2.5">Nguyên liệu</th>
                        {viewingDoc.docType === 'NHAP' ? (
                          <>
                            <th className="p-2.5 text-right">NCC Báo</th>
                            <th className="p-2.5 text-right">Thực Cân</th>
                            <th className="p-2.5 text-right text-rose-600">Lệch (kg)</th>
                          </>
                        ) : (
                          <th className="p-2.5">Số lượng</th>
                        )}
                        <th className="p-2.5 text-right font-mono">{hideFinancials ? 'Ghi Chú' : 'Đơn giá'}</th>
                        <th className="p-2.5 text-right font-mono">{hideFinancials ? 'Trạng Thái' : 'Thành tiền'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(viewingDoc.items || []).map((it, idx) => {
                        const rep = it.supplierReportedWeight ?? it.quantity;
                        const act = it.actualWeight ?? it.quantity;
                        const diff =
                          it.weightDiff !== undefined
                            ? it.weightDiff
                            : Number((act - rep).toFixed(2));
                        const shortage =
                          it.shortageAmount !== undefined
                            ? it.shortageAmount
                            : diff < 0
                            ? Math.round(Math.abs(diff) * it.unitPrice)
                            : 0;

                        return (
                          <tr key={idx}>
                            <td className="p-2.5 font-bold text-slate-800">
                              {it.itemName || it.itemCode}
                              <div className="text-[10px] text-slate-400 font-mono">
                                {it.batchCode || '--'}
                              </div>
                            </td>
                            {viewingDoc.docType === 'NHAP' ? (
                              <>
                                <td className="p-2.5 font-mono text-right text-slate-600">
                                  {rep} {it.unit || 'kg'}
                                </td>
                                <td className="p-2.5 font-mono font-bold text-right text-blue-700">
                                  {act} {it.unit || 'kg'}
                                </td>
                                <td
                                  className={`p-2.5 font-mono font-bold text-right ${
                                    diff < 0 ? 'text-rose-600' : 'text-emerald-600'
                                  }`}
                                >
                                  {diff !== 0 ? (diff > 0 ? `+${diff}` : `${diff}`) : '0.0'} kg
                                  {diff < 0 && !hideFinancials && (
                                    <div className="text-[10px] text-rose-500 font-normal">
                                      -{(shortage || 0).toLocaleString('vi-VN')} đ
                                    </div>
                                  )}
                                </td>
                              </>
                            ) : (
                              <td className="p-2.5 font-mono">
                                {it.quantity} {it.unit || 'kg'}
                              </td>
                            )}
                            <td className="p-2.5 font-mono text-right">
                              {hideFinancials ? (
                                <span className="text-slate-400 text-xs italic">***</span>
                              ) : (
                                `${Number(it.unitPrice).toLocaleString('vi-VN')} đ`
                              )}
                            </td>
                            <td className="p-2.5 font-mono font-bold text-right text-indigo-900">
                              {hideFinancials ? (
                                <span className="text-slate-400 text-xs italic">***</span>
                              ) : (
                                `${(act * it.unitPrice).toLocaleString('vi-VN')} đ`
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {viewingDoc.docType === 'NHAP' && (
                  <div className="mt-2.5 p-3 bg-slate-50 rounded-xl space-y-1 text-xs border border-slate-200">
                    {isKitchenPure ? (
                      <div className="flex justify-between text-slate-800 font-bold">
                        <span>Tổng khối lượng thực nhận:</span>
                        <span className="font-mono text-indigo-700 font-bold">
                          {(viewingDoc.items || []).reduce((acc, it) => acc + (it.actualWeight ?? it.quantity ?? 0), 0).toFixed(1)} kg
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>Tổng tiền hóa đơn NCC báo:</span>
                          <span className="font-mono font-bold">
                            {(viewingDoc.totalReportedAmount || viewingDoc.totalAmount).toLocaleString('vi-VN')}{' '}
                            đ
                          </span>
                        </div>
                        {viewingDoc.totalShortageAmount ? (
                          <div className="flex justify-between text-rose-600 font-bold">
                            <span>Giảm trừ do cân thiếu:</span>
                            <span className="font-mono">
                              -{viewingDoc.totalShortageAmount.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        ) : null}
                        <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                          <span className="text-indigo-900">Công nợ thực trả phiếu này:</span>
                          <span className="font-mono text-indigo-700 font-black">
                            {(
                              viewingDoc.finalPayableAmount ||
                              viewingDoc.totalAmount - (viewingDoc.totalShortageAmount || 0)
                            ).toLocaleString('vi-VN')}{' '}
                            đ
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Invoice Photos */}
              {viewingDoc.imageUrls && (
                <div>
                  <span className="font-bold text-slate-700 block mb-2">Ảnh Hóa Đơn / Chứng Từ:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingDoc.imageUrls
                      .split(';')
                      .filter(Boolean)
                      .map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            handleOpenHDImage(
                              viewingDoc.imageUrls?.split(';').filter(Boolean) || [],
                              i,
                              viewingDoc.docCode
                            )
                          }
                          className="relative group rounded-xl border border-slate-200 overflow-hidden hover:opacity-90"
                        >
                          <img
                            src={url}
                            alt={`Invoice ${i}`}
                            className="h-28 w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all">
                            Xem HD
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Nút Xem Phiếu A4 */}
              {viewingDoc.docType === 'NHAP' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setViewingVoucherDoc(viewingDoc)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Printer className="h-4 w-4" />
                    <span>In / Xem Phiếu Giao Nhận A4 Chuẩn Ký Nhận</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: THÊM / CHỈNH SỬA NHÀ CUNG CẤP                                */}
      {/* =================================================================== */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-700 font-black text-base">
                <Building2 className="h-6 w-6" />
                <span>{editingSupplier ? 'CHỈNH SỬA NHÀ CUNG CẤP' : 'THÊM MỚI NHÀ CUNG CẤP'}</span>
              </div>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-4 mt-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  MÃ NHÀ CUNG CẤP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={supplierCode}
                  onChange={(e) => setSupplierCode(e.target.value.toUpperCase())}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  TÊN NHÀ CUNG CẤP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Công ty Hải Sản Biển Đông"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">SỐ ĐIỆN THOẠI</label>
                <input
                  type="tel"
                  placeholder="0988 123 456"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ĐỊA CHỈ KHO HÀNG</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Số 45 Cảng cá Cẩm Phả, Quảng Ninh"
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="btn-touch h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSupplier}
                  className="btn-touch h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingSupplier ? 'ĐANG LƯU...' : 'LƯU THÔNG TIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: LẬP BIÊN BẢN KIỂM KÊ KHO CA (OBJECTIVE 5)                    */}
      {/* =================================================================== */}
      {showCheckModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600 font-black text-base">
                <ClipboardCheck className="h-6 w-6" />
                <span>LẬP BIÊN BẢN KIỂM KÊ KHO (ĐỐI SOÁT TỒN THỰC TẾ)</span>
              </div>
              <button
                onClick={() => setShowCheckModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitInventoryCheck} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">CA KIỂM KÊ</label>
                  <select
                    value={checkShift}
                    onChange={(e) => setCheckShift(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="CA_TOI">Ca Tối (Cuối ca / Bàn giao)</option>
                    <option value="CA_SANG">Ca Sáng (Đầu ca / Nhận ca)</option>
                    <option value="CA_NGAY">Cả ngày (Đột xuất)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">NGÀY KIỂM KÊ</label>
                  <input
                    type="date"
                    value={checkDate}
                    onChange={(e) => setCheckDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">GHI CHÚ CHUNG</label>
                  <input
                    type="text"
                    placeholder="Bàn giao ca tối..."
                    value={checkNote}
                    onChange={(e) => setCheckNote(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Items Entry Table with Category & High-Value Filters (Objective 5) */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Bảng Đối Soát Tồn Kho
                    </label>

                    {/* Lọc nhanh theo nhóm món trong modal */}
                    <select
                      value={checkModalCategory}
                      onChange={(e) => setCheckModalCategory(e.target.value)}
                      className="h-8 px-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
                    >
                      <option value="ALL">Tất cả nhóm</option>
                      <option value="hải sản">Hải sản tươi sống</option>
                      <option value="bò">Thịt bò</option>
                      <option value="thịt">Thịt heo / gà</option>
                      <option value="rau">Rau củ / nấm</option>
                    </select>

                    {/* Toggle chỉ kiểm hàng đắt tiền trong modal (Objective 5) */}
                    <button
                      type="button"
                      onClick={() => setCheckModalHighValueOnly(!checkModalHighValueOnly)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all ${
                        checkModalHighValueOnly
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>💎 Đắt tiền / nhạy cảm</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-rose-600 font-bold">
                    * Bắt buộc giải trình lý do khi chênh lệch
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-600 sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5">Nguyên liệu</th>
                        <th className="p-2.5">Tồn Hệ Thống</th>
                        <th className="p-2.5">Tồn Thực Tế Đếm Được</th>
                        <th className="p-2.5">Chênh Lệch</th>
                        <th className="p-2.5">Lý Do Chênh Lệch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {checkItemRows
                        .filter((row) => {
                          if (checkModalCategory !== 'ALL') {
                            const found = buffetItems.find((b) => b.id === row.itemId);
                            if (
                              !(found?.category || '')
                                .toLowerCase()
                                .includes(checkModalCategory.toLowerCase())
                            ) {
                              return false;
                            }
                          }
                          if (checkModalHighValueOnly) {
                            const found = buffetItems.find((b) => b.id === row.itemId);
                            if (
                              !isHighValueItem({
                                itemCode: row.itemCode,
                                itemName: row.itemName,
                                costPrice: found?.costPrice,
                              })
                            ) {
                              return false;
                            }
                          }
                          return true;
                        })
                        .map((row, idx) => {
                          const originalIdx = checkItemRows.findIndex(
                            (r) => r.itemId === row.itemId
                          );
                          const diff = row.actualStock - row.systemStock;
                          const hasDiff = diff !== 0;
                          const isHigh = isHighValueItem({
                            itemCode: row.itemCode,
                            itemName: row.itemName,
                          });

                          return (
                            <tr key={idx} className={hasDiff ? 'bg-amber-50/50' : ''}>
                              <td className="p-2.5">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{row.itemName}</span>
                                  {isHigh && (
                                    <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-black">
                                      💎 Đắt tiền
                                    </span>
                                  )}
                                </div>
                                {row.batchCode && (
                                  <span className="font-mono text-[10px] text-indigo-600">
                                    {row.batchCode}
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 font-mono font-bold text-slate-700">
                                {row.systemStock} {row.unit}
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={row.actualStock}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(',', '.');
                                    handleActualStockChange(
                                      originalIdx >= 0 ? originalIdx : idx,
                                      parseFloat(val) || 0
                                    );
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === ',') {
                                      e.preventDefault();
                                      const cur = String(row.actualStock ?? '');
                                      if (!cur.includes('.')) {
                                        handleActualStockChange(
                                          originalIdx >= 0 ? originalIdx : idx,
                                          ((cur ? cur : '0') + '.') as any
                                        );
                                      }
                                    }
                                  }}
                                  className="w-24 h-9 px-2 rounded-lg border border-slate-300 font-mono font-extrabold text-sm focus:ring-2 focus:ring-amber-500"
                                />
                              </td>
                              <td className="p-2.5">
                                {diff === 0 ? (
                                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Khớp</span>
                                  </span>
                                ) : diff < 0 ? (
                                  <span className="text-rose-600 font-extrabold">
                                    {diff.toFixed(2)} {row.unit} (Thiếu)
                                  </span>
                                ) : (
                                  <span className="text-amber-600 font-extrabold">
                                    +{diff.toFixed(2)} {row.unit} (Thừa)
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5">
                                {hasDiff ? (
                                  <div className="space-y-1">
                                    <select
                                      value={row.reason}
                                      onChange={(e) =>
                                        handleReasonChange(
                                          originalIdx >= 0 ? originalIdx : idx,
                                          e.target.value
                                        )
                                      }
                                      className="w-full h-8 px-2 rounded border border-rose-300 bg-white text-[11px] font-semibold text-rose-900 focus:ring-1 focus:ring-rose-500"
                                    >
                                      <option value="">-- Chọn lý do chênh lệch --</option>
                                      <option value="Hao hụt rã đông / sơ chế">Hao hụt rã đông / sơ chế</option>
                                      <option value="Hàng hỏng do bảo quản tủ đông">
                                        Hàng hỏng do bảo quản tủ đông
                                      </option>
                                      <option value="Rơi vãi / thất thoát tại bếp">
                                        Rơi vãi / thất thoát tại bếp
                                      </option>
                                      <option value="Bếp quên chưa bấm phiếu lấy hàng">
                                        Bếp quên chưa bấm phiếu lấy hàng
                                      </option>
                                      <option value="Kiểm đếm sai ở ca trước">Kiểm đếm sai ở ca trước</option>
                                      <option value="Khác (ghi rõ trong ghi chú)">Khác</option>
                                    </select>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">-- Không lệch --</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCheckModal(false)}
                  className="btn-touch h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCheck}
                  className="btn-touch h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
                >
                  {isSubmittingCheck ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>ĐANG LƯU BIÊN BẢN...</span>
                    </>
                  ) : (
                    <span>XÁC NHẬN LƯU BIÊN BẢN</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: XEM CHI TIẾT BIÊN BẢN KIỂM KÊ                                */}
      {/* =================================================================== */}
      {viewingCheck && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600 font-black text-base">
                <ClipboardCheck className="h-5 w-5" />
                <span>CHI TIẾT BIÊN BẢN KIỂM KÊ: {viewingCheck.checkCode}</span>
              </div>
              <button
                onClick={() => setViewingCheck(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[11px]">Ca làm việc</span>
                  <span className="font-bold text-slate-800">
                    {viewingCheck.shift === 'CA_SANG'
                      ? 'Ca Sáng'
                      : viewingCheck.shift === 'CA_TOI'
                      ? 'Ca Tối'
                      : 'Cả ngày'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Ngày kiểm kê</span>
                  <span className="font-mono text-slate-800 font-bold">{viewingCheck.checkDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Người kiểm</span>
                  <span className="font-bold text-slate-800">{viewingCheck.checkedByName || viewingCheck.checkedBy}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Chi nhánh</span>
                  <span className="font-bold text-slate-800">{viewingCheck.branchName || 'Chi nhánh Thái Nguyên'}</span>
                </div>
              </div>

              {viewingCheck.note && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">Ghi chú kiểm kê</span>
                  <p className="text-slate-700 font-medium">{viewingCheck.note}</p>
                </div>
              )}

              <div>
                <span className="font-bold text-slate-700 block mb-2">Bảng Số Liệu Kiểm Kê:</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-600">
                      <tr>
                        <th className="p-2.5">Nguyên liệu</th>
                        <th className="p-2.5 text-right font-mono">Tồn Hệ Thống</th>
                        <th className="p-2.5 text-right font-mono">Tồn Thực Tế</th>
                        <th className="p-2.5 text-right font-mono">Chênh Lệch</th>
                        <th className="p-2.5">Lý Do Giải Trình</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(viewingCheck.items || []).map((it, idx) => {
                        const diff = Number(it.difference || it.actualStock - it.systemStock || 0);
                        const hasDiff = diff !== 0;

                        return (
                          <tr key={idx} className={hasDiff ? 'bg-amber-50/50' : ''}>
                            <td className="p-2.5 font-bold text-slate-900">{it.itemName || it.itemCode}</td>
                            <td className="p-2.5 text-right font-mono">
                              {it.systemStock} {it.unit || 'kg'}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-indigo-900">
                              {it.actualStock} {it.unit || 'kg'}
                            </td>
                            <td
                              className={`p-2.5 text-right font-mono font-black ${
                                diff < 0 ? 'text-rose-600' : diff > 0 ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                            >
                              {diff !== 0 ? (diff > 0 ? `+${diff}` : `${diff}`) : '0.0'} {it.unit || 'kg'}
                            </td>
                            <td className="p-2.5 text-slate-600">
                              {hasDiff ? (
                                <span className="font-semibold text-rose-800">{it.reason || 'Chưa ghi'}</span>
                              ) : (
                                <span className="text-emerald-700 font-semibold">Khớp 100%</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: XEM PHIẾU GIAO NHẬN A4 (OBJECTIVE 2: DELIVERY VOUCHER MODAL)  */}
      {/* =================================================================== */}
      <DeliveryVoucherModal
        isOpen={!!viewingVoucherDoc}
        onClose={() => setViewingVoucherDoc(null)}
        doc={viewingVoucherDoc}
        branchName={user?.branchName}
      />

      {/* =================================================================== */}
      {/* MODAL: PHÓNG TO ẢNH FULL HD (OBJECTIVE 2: HD IMAGE LIGHTBOX MODAL)  */}
      {/* =================================================================== */}
      <HDImageModal
        isOpen={isHDImageOpen}
        onClose={() => setIsHDImageOpen(false)}
        images={hdImages}
        initialIndex={hdImageIndex}
        docCode={hdDocCode}
      />
    </div>
  );
};
