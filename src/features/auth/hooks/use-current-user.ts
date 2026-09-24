"use client";

import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/stores/auth-store";

/* Query key dùng chung để login có thể nạp sẵn cache trước khi vào dashboard. */
export const CURRENT_USER_QUERY_KEY = ["auth", "me"] as const;

/*
 * Hồ sơ người dùng đang đăng nhập. Chỉ chạy khi đã có token (`enabled`), nếu
 * không mỗi lần mở /login sẽ bắn một request chắc chắn 401.
 * `staleTime: Infinity` — hồ sơ không đổi trong một phiên làm việc.
 *
 * Lượt trả về cũng ĐỒNG BỘ vai trò xuống auth store. Đây là chiều đi duy nhất:
 * store chỉ giữ bản sao để vẽ menu cho kịp khung hình đầu, còn `/auth/me` mới
 * là nguồn — admin vừa bị hạ xuống sale sẽ thấy giao diện đổi ngay ở lần tải
 * trang kế tiếp, không phải đăng xuất rồi đăng nhập lại.
 *
 * Ghi ngay trong `queryFn` (giống `useLogin` ghi token) thay vì trong effect:
 * effect chạy sau khi đã render một lượt, tức là thêm đúng một khung hình vẽ
 * bằng vai trò cũ.
 */
export function useCurrentUser() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async () => {
      const user = await getMe();
      useAuthStore.getState().setRole(user.role);
      return user;
    },
    enabled: !!token,
    staleTime: Infinity,
  });
}
