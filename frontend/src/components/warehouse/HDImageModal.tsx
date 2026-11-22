import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileText,
} from 'lucide-react';

interface HDImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  title?: string;
  docCode?: string;
}

export const HDImageModal: React.FC<HDImageModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  title = 'Ảnh Hóa Đơn / Chứng Từ Giao Hàng (Full HD)',
  docCode,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  // Sync index when initialIndex changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
      setZoomLevel(1);
      setRotation(0);
    }
  }, [isOpen, initialIndex, images.length]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoomLevel(1);
    setRotation(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
    setRotation(0);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = currentImage;
    a.download = `Chung_tu_${docCode || 'kho'}_anh_${currentIndex + 1}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
              <span>{title}</span>
              {docCode && (
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                  {docCode}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Đang xem ảnh {currentIndex + 1} / {images.length} • Thu phóng {Math.round(zoomLevel * 100)}%
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            title="Phóng to (+)"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            title="Thu nhỏ (-)"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            title="Xoay 90 độ"
          >
            <RotateCw className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            title="Về cỡ chuẩn (100%)"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            title="Tải ảnh về máy"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-rose-300 hover:text-white hover:bg-rose-600/30 rounded-xl ml-2 transition-all border border-rose-500/30"
            title="Đóng (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Image View Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden my-3 select-none">
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 hover:scale-105 transition-all shadow-xl"
            title="Ảnh trước"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div className="w-full h-full flex items-center justify-center p-2 overflow-auto">
          <img
            src={currentImage}
            alt={`Chứng từ ${currentIndex + 1}`}
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              transition: 'transform 0.15s ease-out',
            }}
            className="max-h-full max-w-full object-contain rounded-xl shadow-2xl pointer-events-auto"
          />
        </div>

        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 hover:scale-105 transition-all shadow-xl"
            title="Ảnh tiếp theo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/10 overflow-x-auto py-1 z-10">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCurrentIndex(idx);
                setZoomLevel(1);
                setRotation(0);
              }}
              className={`relative h-16 w-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                idx === currentIndex
                  ? 'border-indigo-400 ring-2 ring-indigo-400/50 scale-105'
                  : 'border-white/20 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Thumb ${idx}`} className="h-full w-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] text-white text-center py-0.5 font-mono">
                #{idx + 1}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
