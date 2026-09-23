/*
 * Kiểu dùng chung cho toàn app — khớp docs/API_CONTRACT.md §Envelope và §Phân trang.
 * Đây là hình dạng THÔ của response; tầng axios (lib/api.ts) bóc `data` ra trước
 * khi trả về cho feature, nên component/hook chỉ thấy payload bên trong.
 */

export interface ApiErrorBody {
  code: string;
  message: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorBody | null;
  request_id?: string;
}

/** Trang dữ liệu chuẩn của backend: `{ items, page, size, total, pages }`. */
export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  pages: number;
}

/** Tham số phân trang dùng chung (page 1-based, size tối đa 200). */
export interface PageParams {
  page?: number;
  size?: number;
}
