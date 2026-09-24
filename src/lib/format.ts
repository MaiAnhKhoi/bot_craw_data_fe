/*
 * Hàm định dạng thuần (không phụ thuộc React/API) dùng chung cho mọi màn hình.
 * Tất cả đều nhận `null | undefined` và trả về dấu gạch ngang, vì dữ liệu quét
 * từ Google Maps thiếu trường là chuyện thường ngày.
 */

const DASH = "—";

const numberFormatter = new Intl.NumberFormat("vi-VN");
const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
});

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return DASH;
  return numberFormatter.format(value);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return DASH;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return DASH;
  return dateTimeFormatter.format(date);
}

/** Nhãn ngắn cho trục biểu đồ 14 ngày: "23/09". */
export function formatShortDate(value: string | null | undefined): string {
  if (!value) return DASH;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return DASH;
  return dateFormatter.format(date);
}

/** Tỉ lệ phần trăm an toàn khi mẫu số bằng 0. */
export function formatPercent(part: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

export function percentValue(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

/** Khoảng thời gian tương đối gọn: "3 phút trước". */
export function formatRelative(value: string | null | undefined): string {
  if (!value) return DASH;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return DASH;
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "vừa xong";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.round(hours / 24);
  return `${days} ngày trước`;
}

/*
 * Ngược chiều `formatRelative`: khoảng cách tới một mốc ở TƯƠNG LAI, không kèm
 * chữ "còn" — "12 phút", "dưới 1 phút". Nơi gọi tự ghép câu, vì cùng một con số
 * có chỗ đọc là "còn 12 phút", có chỗ là "thử lại sau 12 phút".
 *
 * Mốc đã qua thì trả về CHUỖI RỖNG chứ không phải gạch ngang: thứ duy nhất có
 * thể làm với nó là ngừng hiện, mà "còn —" thì trông y như dữ liệu hỏng.
 *
 * Làm tròn LÊN (ceil) vì đây là đồng hồ đếm ngược: báo thiếu một phút thì người
 * dùng bấm lại sớm, mà bấm sớm trong lúc đang bị khoá là bị từ chối thêm lần
 * nữa — đúng cái vòng luẩn quẩn mà con số này sinh ra để cắt.
 */
export function formatRemaining(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.ceil((date.getTime() - Date.now()) / 1000);
  if (seconds <= 0) return "";
  if (seconds < 60) return "dưới 1 phút";
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return `${hours} giờ`;
  return `${Math.ceil(hours / 24)} ngày`;
}

/** Bỏ giao thức cho gọn khi hiện link website trong bảng. */
export function shortenUrl(url: string | null | undefined): string {
  if (!url) return DASH;
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

/** Tách textarea "mỗi dòng một giá trị" thành mảng đã trim, bỏ dòng trống. */
export function splitLines(value: string): string[] {
  return value
    .split(String.fromCharCode(10))
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
