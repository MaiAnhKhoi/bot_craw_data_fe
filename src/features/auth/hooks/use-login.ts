"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "@/features/auth/api/auth-api";
import { CURRENT_USER_QUERY_KEY } from "@/features/auth/hooks/use-current-user";
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
 *
 * KHÔNG có `onError` đổ ra toast: lỗi đăng nhập được hiện NGAY TRONG FORM (xem
 * login-form.tsx). Toast tự tắt sau vài giây, mà câu quan trọng nhất từ khi có
 * khoá tạm lại là câu kèm số phút còn phải chờ — người dùng cần đọc lại nó
 * trong lúc ngồi đợi, chứ không phải nhìn nó trôi đi. Để cả hai thì cùng một
 * câu hiện hai chỗ.
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
  });
}
