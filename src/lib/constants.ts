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
  users: "/users",
} as const;

/** Prefix của mọi lời gọi REST (axios baseURL). Dùng chung cho cả URL SSE/export. */
export const API_PREFIX = "/api/v1";

/** Khoá localStorage giữ access token. */
export const TOKEN_STORAGE_KEY = "bcd_token";

/*
 * Khoá localStorage nhớ VAI TRÒ của phiên đang đăng nhập.
 *
 * Nằm cạnh token vì nó phải đọc được NGAY ở khung hình đầu tiên: menu và các
 * nút chỉ-admin dựng theo vai trò, mà `/auth/me` phải bay một vòng mới về. Thiếu
 * nó thì mỗi lần F5, admin thấy menu thiếu mục rồi mục đó nhảy vào — trông y
 * như giao diện lỗi.
 *
 * KHÔNG phải nơi giữ sự thật: `/auth/me` mới là nguồn, và mọi chặn thật nằm ở
 * backend (403). Sửa tay giá trị này chỉ đổi được mấy cái nút trên máy mình.
 */
export const ROLE_STORAGE_KEY = "bcd_role";

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
  /*
   * `/keywords/status` chỉ cho biết backend đã cấu hình khoá AI hay chưa. Nó đổi
   * khi ai đó sửa biến môi trường rồi khởi động lại backend — hiếm, nhưng không
   * phải không bao giờ, nên 5 phút chứ không vĩnh viễn.
   */
  keywords: 5 * 60_000,
  /*
   * Danh sách tài khoản: khoảng chục dòng và chỉ đổi khi admin tự tay thêm/sửa
   * người — mà lúc đó mutation đã invalidate rồi. Một phút là quá đủ.
   */
  users: 60_000,
} as const;

/** Cỡ trang mặc định; backend chặn tối đa 200. */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

/** Ngưỡng bật virtual scroll cho bảng Địa điểm (theo yêu cầu: size > 100). */
export const VIRTUAL_ROW_THRESHOLD = 100;
