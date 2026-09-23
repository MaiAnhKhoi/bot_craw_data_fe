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
 */
export function useCurrentUser() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getMe,
    enabled: !!token,
    staleTime: Infinity,
  });
}
