import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  closeOnOverlayClick?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
  full: 'max-w-full m-4',
};

/**
 * Modal Dialog chuẩn Desktop / Tablet.
 * - Căn giữa màn hình, hiệu ứng zoom-in & fade-in mượt mà.
 * - Hỗ trợ đóng qua phím Esc và click ngoài backdrop.
 * - Khóa cuộn background khi đang mở.
 * - Nút X lớn đạt chuẩn kích thước 44x44px.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Centering wrapper */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={() => closeOnOverlayClick && onClose()}
          aria-hidden="true"
        />

        {/* Modal Window Container */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          className={`relative w-full ${SIZE_MAP[size]} transform overflow-hidden rounded-2xl bg-white text-left shadow-floating transition-all border border-slate-100 flex flex-col max-h-[90vh] my-auto animate-fade-in ${className}`}
        >
          {/* Header */}
          {(title || subtitle) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
              <div className="min-w-0 pr-4">
                {typeof title === 'string' ? (
                  <h3 className="text-lg font-bold text-slate-900 truncate">{title}</h3>
                ) : (
                  title
                )}
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Đóng"
                className="btn-touch p-2 -mr-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Modal Body */}
          <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0 text-slate-800">
            {children}
          </div>

          {/* Modal Footer */}
          {footer && (
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex-shrink-0 flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
