"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { changePassword } from "@/features/auth/api/auth-api";
import { errorMessage } from "@/lib/api";
import type { ChangePasswordRequest } from "@/features/auth/types/auth";

/*
 * Tự đổi mật khẩu.
 *
 * KHÔNG đụng vào token và KHÔNG dọn cache: backend giữ nguyên phiên hiện tại,
 * nên đá người dùng về màn đăng nhập chỉ là bắt họ gõ lại mật khẩu vừa đặt.
 *
 * Lỗi hay gặp nhất là gõ sai mật khẩu hiện tại — backend trả 4xx kèm câu tiếng
 * Việt của nó, ta hiện nguyên văn chứ không quy về một câu chung chung, vì
 * "sai mật khẩu hiện tại" và "mật khẩu mới quá yếu" cần hai cách xử lý khác hẳn.
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordRequest) => changePassword(input),
    onSuccess: () => {
      toast.success("Đã đổi mật khẩu. Lần đăng nhập sau dùng mật khẩu mới.");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Không đổi được mật khẩu."));
    },
  });
}
