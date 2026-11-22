import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string; // Default: 'max-h-[88vh]'
  className?: string;
}

/**
 * BottomSheet (Drawer mở từ dưới cho Mobile Phone).
 * Chuẩn UI/UX:
 * - Vuốt thanh handle xuống để đóng nhanh (Swipe to dismiss).
 * - Bấm vùng backdrop hoặc nút X (min 44px) để đóng.
 * - Hỗ trợ phím Escape.
 * - Khóa cuộn trang nền khi mở.
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeight = 'max-h-[88vh]',
  className = '',
}) => {
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Khóa cuộn nền khi BottomSheet mở
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalStyle;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Xử lý cử chỉ vuốt kéo xuống (Swipe-to-dismiss)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 90) {
      onClose();
    }
    setTouchStartY(null);
    setDragOffset(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop mờ nền */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Container trượt từ dưới lên */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: dragOffset > 0 ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`relative z-10 w-full bg-white rounded-t-3xl shadow-drawer flex flex-col ${maxHeight} animate-slide-up pb-safe ${className}`}
      >
        {/* Handle Bar vuốt đóng */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full pt-3 pb-2 flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
        >
          <div className="w-12 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full transition-colors" />
        </div>

        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
            <div className="min-w-0 pr-3">
              {title && (
                <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {title}
                </div>
              )}
              {subtitle && (
                <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{subtitle}</div>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="btn-touch p-2 -mr-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0 text-slate-800">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 rounded-b-none flex-shrink-0 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomSheet;
