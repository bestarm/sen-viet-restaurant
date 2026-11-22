import React, { useRef } from 'react';
import {
  Printer,
  X,
  FileCheck,
  Building,
  Calendar,
  User,
  Scale,
  MinusCircle,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { WarehouseDocument } from '../../api/warehouse';

interface DeliveryVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: WarehouseDocument | null;
  branchName?: string | null;
}

export const DeliveryVoucherModal: React.FC<DeliveryVoucherModalProps> = ({
  isOpen,
  onClose,
  doc,
  branchName = 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !doc) return null;

  const handlePrint = () => {
    window.print();
  };

  // Helper chuyển số thành chữ (tiếng Việt cơ bản cho tổng tiền)
  const formatMoneyText = (amount: number): string => {
    if (amount <= 0) return 'Không đồng';
    // Đơn giản hóa hiển thị tiền triệu
    const million = Math.floor(amount / 1000000);
    const thousand = Math.floor((amount % 1000000) / 1000);
    let str = '';
    if (million > 0) str += `${million} triệu `;
    if (thousand > 0) str += `${thousand} nghìn `;
    return (str.trim() || `${amount.toLocaleString('vi-VN')}`) + ' đồng';
  };

  const totalReportedQty = (doc.items || []).reduce(
    (acc, it) => acc + (it.supplierReportedWeight ?? it.quantity ?? 0),
    0
  );
  const totalActualQty = (doc.items || []).reduce(
    (acc, it) => acc + (it.actualWeight ?? it.quantity ?? 0),
    0
  );
  const totalDiffQty = Number((totalActualQty - totalReportedQty).toFixed(2));
  const totalReportedAmount =
    doc.totalReportedAmount ||
    (doc.items || []).reduce(
      (acc, it) => acc + (it.supplierReportedWeight ?? it.quantity) * it.unitPrice,
      0
    );
  const totalShortageAmount =
    doc.totalShortageAmount !== undefined
      ? doc.totalShortageAmount
      : (doc.items || []).reduce((acc, it) => acc + (it.shortageAmount || 0), 0);
  const finalPayable =
    doc.finalPayableAmount || Math.max(0, totalReportedAmount - totalShortageAmount);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-4 max-h-[96vh] flex flex-col">
        {/* Modal Top Control Bar (Ẩn khi in ấn) */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-indigo-400" />
            <span className="font-extrabold text-sm sm:text-base">
              XEM TRƯỚC PHIẾU GIAO NHẬN A4 (CHUẨN HÓA KÝ NHẬN)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Printer className="h-4 w-4" />
              <span>In Phiếu (Ctrl + P)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* A4 PRINTABLE DOCUMENT BODY                                        */}
        {/* ================================================================= */}
        <div
          ref={printRef}
          className="p-6 sm:p-10 bg-white text-slate-900 overflow-y-auto flex-1 text-xs sm:text-sm font-sans"
          id="voucher-printable-area"
        >
          {/* Header 2 Bên */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-4 border-b-2 border-slate-900 gap-4">
            <div>
              <div className="font-black text-sm sm:text-base text-slate-800 uppercase tracking-tight">
                CÔNG TY T&T NGUYỄN DƯƠNG — HỆ THỐNG BUFFET SEN VIỆT
              </div>
              <div className="font-black text-lg sm:text-xl text-indigo-950 uppercase tracking-tight mt-0.5">
                HỆ THỐNG SEN VIỆT BUFFET
              </div>
              <div className="font-semibold text-slate-700 mt-0.5">
                {doc.branchName || branchName}
              </div>
              <div className="text-slate-500 text-xs">
                Địa chỉ: Số 123 Đường Phan Đình Phùng, TP. Thái Nguyên • Hotline: 0988.123.456
              </div>
              <div className="text-slate-500 text-xs">
                Kho vận & Bếp: Phân hệ tiếp nhận cân điện tử tự động
              </div>
            </div>

            <div className="sm:text-right border sm:border-0 p-3 sm:p-0 rounded-xl bg-slate-50 sm:bg-transparent">
              <div className="font-mono text-sm sm:text-base font-black text-indigo-700">
                {doc.docCode}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Mẫu số: <strong>01-VT/SVB</strong>
              </div>
              <div className="text-xs text-slate-500">
                Ngày giờ lập: <strong>{doc.createdAt || new Date().toLocaleString('vi-VN')}</strong>
              </div>
              <div className="text-[11px] text-emerald-700 font-bold mt-1">
                ✓ Trạng thái: ĐÃ CÂN THỰC TẾ & XÁC NHẬN
              </div>
            </div>
          </div>

          {/* Title Tiêu Đề Phiếu */}
          <div className="text-center my-6">
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-wide">
              PHIẾU GIAO NHẬN HÀNG HÓA KIÊM BIÊN BẢN CÂN KHO
            </h1>
            <p className="text-xs text-slate-500 italic mt-1">
              (Dùng làm căn cứ nhập kho, đối soát chênh lệch cân và thanh toán công nợ nhà cung cấp)
            </p>
          </div>

          {/* Thông Tin Đối Tác Giao Nhận */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-6">
            <div className="space-y-1.5">
              <div>
                <span className="text-slate-500">Nhà cung cấp: </span>
                <strong className="text-slate-900 font-bold text-sm">
                  {doc.supplierName || doc.supplierCode || 'Nhà Cung Cấp Tổng'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Mã đối tác: </span>
                <strong className="font-mono text-slate-800">{doc.supplierCode || 'NCC-DEFAULT'}</strong>
              </div>
              <div>
                <span className="text-slate-500">Người đại diện giao: </span>
                <span className="font-semibold text-slate-800">Tài xế / Đại diện NCC</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div>
                <span className="text-slate-500">Thủ kho / Bếp tiếp nhận: </span>
                <strong className="text-slate-900 font-bold">
                  {doc.createdByName || doc.createdBy || 'Lê Hoàng Quản Lý (Kho Thái Nguyên)'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Hình thức nhập: </span>
                <span className="font-semibold text-indigo-700">
                  {doc.docType === 'NHAP' ? 'Nhập hàng hóa đơn NCC' : 'Phiếu điều chuyển kho'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Ghi chú giao hàng: </span>
                <span className="italic text-slate-700">
                  {doc.note || 'Hàng tươi sống giao theo thỏa thuận hợp đồng'}
                </span>
              </div>
            </div>
          </div>

          {/* BẢNG CHI TIẾT 2 CỘT: NCC BÁO VS THỰC CÂN */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-2.5 text-center w-10">STT</th>
                  <th className="p-2.5">Mặt Hàng / Nguyên Liệu</th>
                  <th className="p-2.5 text-center w-14">ĐVT</th>
                  <th className="p-2.5 text-center">Mã Lô (LOT)</th>
                  <th className="p-2.5 text-right bg-amber-50/70 border-x border-slate-200">
                    NCC Báo (kg)
                  </th>
                  <th className="p-2.5 text-right bg-indigo-50/70 border-r border-slate-200">
                    Thực Cân (kg)
                  </th>
                  <th className="p-2.5 text-right font-bold text-rose-600">Lệch (kg)</th>
                  <th className="p-2.5 text-right font-mono">Đơn Giá (đ)</th>
                  <th className="p-2.5 text-right font-mono bg-slate-50">Tiền NCC Báo (đ)</th>
                  <th className="p-2.5 text-right font-mono text-rose-700 bg-rose-50/60">
                    Trừ Thiếu (-đ)
                  </th>
                  <th className="p-2.5 text-right font-mono font-black text-indigo-900 bg-indigo-50/60">
                    Thực Trả (đ)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {(doc.items || []).map((item, idx) => {
                  const rep = item.supplierReportedWeight ?? item.quantity;
                  const act = item.actualWeight ?? item.quantity;
                  const diff =
                    item.weightDiff !== undefined
                      ? item.weightDiff
                      : Number((act - rep).toFixed(2));
                  const repAmount = rep * item.unitPrice;
                  const shortage =
                    item.shortageAmount !== undefined
                      ? item.shortageAmount
                      : diff < 0
                      ? Math.round(Math.abs(diff) * item.unitPrice)
                      : 0;
                  const payable = Math.max(0, repAmount - shortage);

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900">
                        {item.itemName || item.itemCode}
                        {item.expiryDate && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            Hạn dùng: {item.expiryDate}
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-medium">{item.unit || 'kg'}</td>
                      <td className="p-2.5 text-center font-mono text-[11px] text-slate-600">
                        {item.batchCode || '--'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-semibold bg-amber-50/40 border-x border-slate-100">
                        {rep}
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-indigo-900 bg-indigo-50/40 border-r border-slate-100">
                        {act}
                      </td>
                      <td
                        className={`p-2.5 text-right font-mono font-bold ${
                          diff < 0 ? 'text-rose-600' : diff > 0 ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {diff !== 0 ? (diff > 0 ? `+${diff}` : `${diff}`) : '0.0'}
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-600">
                        {item.unitPrice.toLocaleString('vi-VN')}
                      </td>
                      <td className="p-2.5 text-right font-mono font-semibold bg-slate-50/50">
                        {repAmount.toLocaleString('vi-VN')}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-rose-700 bg-rose-50/30">
                        {shortage > 0 ? `-${shortage.toLocaleString('vi-VN')}` : '0'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-indigo-950 bg-indigo-50/30">
                        {payable.toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  );
                })}

                {/* Hàng Tổng Cộng */}
                <tr className="bg-slate-100/90 font-black text-slate-950 border-t-2 border-slate-400">
                  <td colSpan={4} className="p-3 text-center uppercase tracking-wide">
                    TỔNG CỘNG PHIẾU
                  </td>
                  <td className="p-3 text-right font-mono bg-amber-100/70 border-x border-slate-300">
                    {totalReportedQty.toFixed(2)} kg
                  </td>
                  <td className="p-3 text-right font-mono bg-indigo-100/70 border-r border-slate-300">
                    {totalActualQty.toFixed(2)} kg
                  </td>
                  <td
                    className={`p-3 text-right font-mono ${
                      totalDiffQty < 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {totalDiffQty !== 0
                      ? totalDiffQty > 0
                        ? `+${totalDiffQty}`
                        : `${totalDiffQty}`
                      : '0.0'}{' '}
                    kg
                  </td>
                  <td className="p-3"></td>
                  <td className="p-3 text-right font-mono">
                    {totalReportedAmount.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-3 text-right font-mono text-rose-700 bg-rose-100/70">
                    {totalShortageAmount > 0
                      ? `-${totalShortageAmount.toLocaleString('vi-VN')} đ`
                      : '0 đ'}
                  </td>
                  <td className="p-3 text-right font-mono text-indigo-950 text-sm bg-indigo-100/70">
                    {finalPayable.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tóm Tắt & Cam Kết Nghiệp Vụ */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs mb-8 space-y-2">
            <div className="flex items-start gap-2 text-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Cam kết xác nhận đối soát khối lượng:</strong> Hai bên (Đại diện NCC và Thủ
                kho Sen Việt Buffet) xác nhận đã cùng giám sát quá trình cân thực tế tại bàn cân
                điện tử chi nhánh. Toàn bộ chênh lệch cân{' '}
                <strong className="text-rose-700">
                  ({totalDiffQty < 0 ? `thiếu ${Math.abs(totalDiffQty)} kg` : 'đủ khối lượng'})
                </strong>{' '}
                đã được ghi nhận và tự động khấu trừ{' '}
                <strong className="text-rose-700">
                  {totalShortageAmount.toLocaleString('vi-VN')} đ
                </strong>{' '}
                vào công nợ kỳ 5-10 ngày gần nhất.
              </div>
            </div>
            <div className="text-[11px] text-slate-600 italic">
              * Tổng số tiền công nợ thực tế ghi nhận bằng chữ:{' '}
              <strong className="text-indigo-900 not-italic font-bold">
                {formatMoneyText(finalPayable)}
              </strong>
            </div>
          </div>

          {/* 4 Khung Chữ Ký Chuẩn */}
          <div className="grid grid-cols-4 gap-4 pt-6 border-t border-slate-300 text-center text-xs">
            <div className="space-y-1">
              <div className="font-extrabold uppercase text-slate-800">ĐẠI DIỆN BÊN GIAO (NCC)</div>
              <div className="text-[10px] text-slate-400 italic">(Ký & ghi rõ họ tên)</div>
              <div className="h-20 flex items-end justify-center">
                <span className="text-xs font-serif italic text-slate-400">Đã ký xác nhận</span>
              </div>
              <div className="font-bold text-slate-700 border-t border-dashed border-slate-300 pt-1">
                Tài xế giao hàng
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-extrabold uppercase text-slate-800">THỦ KHO TIẾP NHẬN</div>
              <div className="text-[10px] text-slate-400 italic">(Ký & ghi rõ họ tên)</div>
              <div className="h-20 flex items-end justify-center">
                <span className="text-xs font-serif italic text-indigo-700 font-bold">Lê Hoàng</span>
              </div>
              <div className="font-bold text-slate-700 border-t border-dashed border-slate-300 pt-1">
                Lê Hoàng (Thủ kho)
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-extrabold uppercase text-slate-800">BẾP TRƯỞNG NGHIỆM THU</div>
              <div className="text-[10px] text-slate-400 italic">(Kiểm tra chất lượng hàng)</div>
              <div className="h-20 flex items-end justify-center">
                <span className="text-xs font-serif italic text-slate-400">Đã đạt chuẩn tươi</span>
              </div>
              <div className="font-bold text-slate-700 border-t border-dashed border-slate-300 pt-1">
                Nguyễn Bá Hoan
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-extrabold uppercase text-slate-800">KẾ TOÁN KHO CHI NHÁNH</div>
              <div className="text-[10px] text-slate-400 italic">(Vào sổ công nợ)</div>
              <div className="h-20 flex items-end justify-center">
                <span className="text-xs font-serif italic text-emerald-700 font-bold">Vũ Thủy</span>
              </div>
              <div className="font-bold text-slate-700 border-t border-dashed border-slate-300 pt-1">
                Vũ Thủy (Kế toán)
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-700"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <Printer className="h-4 w-4" />
            <span>In Phiếu A4 Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
