"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { login } from "@/features/auth/api/auth-api";
import { CURRENT_USER_QUERY_KEY } from "@/features/auth/hooks/use-current-user";
import { errorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { LoginInput } from "@/features/auth/schemas/login-schema";

/*
 * Mutation đăng nhập: gọi POST /auth/login → lưu token + vai trò (localStorage
 * + store) → đổ sẵn hồ sơ người dùng vào cache để khung dashboard render ngay,
 * không phải chờ thêm một vòng /auth/me.
 *
 * Hồ sơ KHÔNG nằm trong zustand: đó là dữ liệu server, thuộc về TanStack Query.
 * Riêng `role` có thêm một bản sao cạnh token vì menu và các nút chỉ-admin phải
 * dựng được ngay ở khung hình đầu sau khi F5 (xem auth-store.ts).
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const result = await login(input);
      useAuthStore.getState().setSession(result.access_token, result.user.role);
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, result.user);
      return result;
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Đăng nhập thất bại. Vui lòng thử lại."));
    },
  });
}
