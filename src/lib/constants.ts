/*
 * Hằng số dùng chung cho cả app.
 * Đường dẫn route CHỈ khai ở đây — không hardcode chuỗi path trong component.
 */

export const ROUTES = {
  login: "/login",
  dashboard: "/",
  jobs: "/jobs",
  jobDetail: (id: number | string) => `/jobs/${id}`,
  places: "/places",
} as const;

/** Prefix của mọi lời gọi REST (axios baseURL). Dùng chung cho cả URL SSE/export. */
export const API_PREFIX = "/api/v1";

/** Khoá localStorage giữ access token. */
export const TOKEN_STORAGE_KEY = "bcd_token";

/** Khoá localStorage ghi nhớ cột đang ẩn/hiện của bảng Địa điểm. */
export const PLACES_COLUMNS_STORAGE_KEY = "bcd_places_columns";

/*
 * staleTime theo tính chất dữ liệu (Rule 1 — không polling vô tội vạ).
 * Tiến độ job đã có SSE nên KHÔNG đặt refetchInterval cho jobs.
 */
export const STALE_TIME = {
  stats: 30_000,
  worker: 30_000,
  places: 10_000,
  jobs: 10_000,
  /*
   * Danh mục địa giới hành chính (/geo/*) là dữ liệu THAM CHIẾU TĨNH — backend
   * nạp từ một file JSON được commit, mỗi năm đổi một lần. Không có lý do gì để
   * nó cũ đi giữa phiên làm việc, nên không bao giờ refetch.
   */
  geo: Infinity,
} as const;

/** Cỡ trang mặc định; backend chặn tối đa 200. */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

/** Ngưỡng bật virtual scroll cho bảng Địa điểm (theo yêu cầu: size > 100). */
export const VIRTUAL_ROW_THRESHOLD = 100;
