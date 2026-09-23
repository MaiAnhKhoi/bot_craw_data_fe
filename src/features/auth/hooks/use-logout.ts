"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth-store";

/*
 * Đăng xuất: backend không có endpoint /auth/logout (contract §1), nên việc duy
 * nhất cần làm là xoá token và DỌN SẠCH cache query — bỏ bước dọn cache thì
 * người đăng nhập sau vẫn thấy lead của người trước cho tới lần refetch đầu.
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useCallback(() => {
    useAuthStore.getState().clear();
    queryClient.clear();
    router.replace(ROUTES.login);
  }, [queryClient, router]);
}
