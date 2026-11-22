/**
 * Utility nén ảnh tự động trên trình duyệt qua HTML5 Canvas API kèm Watermark chống gian lận.
 * 
 * Nghiệp vụ: Thiết bị di động của nhân viên bếp thường chụp ảnh độ phân giải cao (3MB - 10MB),
 * gây nghẽn băng thông và tốn bộ nhớ server. Hàm này tự động resize về tối đa 1280x720,
 * nén JPEG chất lượng 0.75 để dung lượng đầu ra luôn dưới 250KB trước khi upload.
 * 
 * KHO-03: In dải Watermark góc dưới ảnh với định dạng:
 * 📍 [Sen Việt - Thái Nguyên] 21/11/2026 08:35 | NV: Bếp | Phiếu: Nhập kho
 */

export interface WatermarkOptions {
  branchName?: string;
  userName?: string;
  docType?: string;
  docTypeName?: string;
  datetime?: string;
  customText?: string;
}

export interface CompressionResult {
  dataUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  originalSizeKb: number;
  compressedSizeKb: number;
  width: number;
  height: number;
}

/**
 * Format chuỗi ký tự hiển thị Watermark chuẩn Sen Việt Buffet
 */
export function formatWatermarkText(options?: WatermarkOptions): string {
  if (options?.customText) return options.customText;
  const branchName = options?.branchName || 'Thái Nguyên';
  const userName = options?.userName || 'Bếp';
  const docType = options?.docType || options?.docTypeName || 'Nhập kho';
  let datetime = options?.datetime;

  if (!datetime) {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    datetime = `${d}/${m}/${y} ${hh}:${mm}`;
  }

  return `📍 [Sen Việt - ${branchName}] ${datetime} | NV: ${userName} | Phiếu: ${docType}`;
}

/**
 * Vẽ thanh nền bán trong suốt và in dải watermark góc dưới ảnh trên Canvas
 */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options?: WatermarkOptions
): void {
  const text = formatWatermarkText(options);

  // Tính kích thước chữ và dải nền đen bán trong suốt dựa vào kích thước canvas
  const fontSize = Math.max(12, Math.min(22, Math.round(width / 45)));
  const barHeight = fontSize + 16;
  const yStart = height - barHeight;

  ctx.save();
  // Vẽ dải nền tối mờ ở đáy ảnh để chữ luôn tương phản rõ nét
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, yStart, width, barHeight);

  // Vẽ text watermark
  ctx.font = `bold ${fontSize}px "Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, 14, yStart + barHeight / 2);
  ctx.restore();
}

/**
 * Nén ảnh tự động và tùy chọn in Watermark lên ảnh trước khi xuất base64
 */
export async function compressImage(
  file: File,
  maxWidth = 1280,
  maxHeight = 720,
  quality = 0.75,
  watermark?: WatermarkOptions | boolean
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Tính toán tỷ lệ giữ nguyên khung hình (maintain aspect ratio)
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Không thể khởi tạo Canvas 2D Context'));
          return;
        }

        // Vẽ ảnh lên canvas với kích thước đã resize
        ctx.drawImage(img, 0, 0, width, height);

        // Vẽ watermark nếu được kích hoạt
        if (watermark) {
          const watermarkOpts = typeof watermark === 'object' ? watermark : undefined;
          drawWatermark(ctx, width, height, watermarkOpts);
        }

        // Xuất data URL định dạng image/jpeg với chất lượng nén quy định
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Tính dung lượng ước lượng từ độ dài base64 string
        const base64Length = dataUrl.length - 'data:image/jpeg;base64,'.length;
        const compressedSizeBytes = Math.round((base64Length * 3) / 4);

        resolve({
          dataUrl,
          originalSizeBytes: file.size,
          compressedSizeBytes,
          originalSizeKb: Math.round(file.size / 1024),
          compressedSizeKb: Math.round(compressedSizeBytes / 1024),
          width,
          height,
        });
      };

      img.onerror = () => {
        reject(new Error('Không thể tải file hình ảnh'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Lỗi khi đọc file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Helper gọi nén ảnh kèm in Watermark bắt buộc (KHO-03)
 */
export async function compressImageWithWatermark(
  file: File,
  watermark?: WatermarkOptions,
  maxWidth = 1280,
  maxHeight = 720,
  quality = 0.75
): Promise<CompressionResult> {
  return compressImage(file, maxWidth, maxHeight, quality, watermark || true);
}
