import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

/*
 * Cấu hình TanStack Query dùng chung.
 * - staleTime mặc định 10s; màn nào cần khác thì khai tại hook của feature
 *   (stats 30s, places 10s — xem lib/constants.ts STALE_TIME).
 * - KHÔNG thử lại lỗi 401/403/404: quyền thiếu hay bản ghi không tồn tại thì
 *   gọi lại vẫn hỏng, chỉ tốn thêm một vòng chờ trước khi hiện lỗi.
 * - Không refetch khi focus lại cửa sổ: bảng lead lớn, refetch tự động mỗi lần
 *   người dùng alt-tab là tải vô ích (Rule 1).
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const status = error instanceof ApiError ? error.status : undefined;
          if (status === 401 || status === 403 || status === 404) return false;
          return failureCount < 1;
        },
      },
    },
  });
}
