"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createUser,
  resetUserPassword,
  unlockUser,
  updateUser,
} from "@/features/users/api/users-api";
import { userKeys } from "@/features/users/hooks/use-users";
import { errorMessage } from "@/lib/api";
import type { Account, AccountCreate, AccountUpdate } from "@/features/users/types/user";

/*
 * Bốn mutation của màn Quản lý tài khoản.
 *
 * VÌ SAO KHÔNG NUỐT LỖI: backend là nơi duy nhất biết đủ ngữ cảnh để từ chối —
 * tự khoá chính mình, hạ vai trò của admin CUỐI CÙNG, trùng tên đăng nhập — và
 * nó trả về câu tiếng Việt nói đúng ca nào đang xảy ra. Quy tất cả về "Không
 * lưu được" là lấy đi thứ duy nhất giúp người dùng tự gỡ. Chuỗi dự phòng chỉ
 * dùng khi mạng đứt, lúc đó backend chẳng nói gì cả.
 *
 * Hễ làm đổi bảng thì `invalidateQueries(userKeys.all)` thay vì vá tay vào
 * cache: bảng này chỉ mươi dòng và mỗi lần sửa là một thao tác có chủ ý của
 * admin, không phải nhịp bấm liên tục như đánh dấu lead bên màn Địa điểm.
 */

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AccountCreate) => createUser(input),
    onSuccess: (account) => {
      toast.success(`Đã tạo tài khoản "${account.username}".`);
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Không tạo được tài khoản."));
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: AccountUpdate }) =>
      updateUser(id, input),
    onSuccess: (account: Account) => {
      toast.success(`Đã lưu thay đổi cho "${account.username}".`);
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Không lưu được thay đổi."));
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: number; newPassword: string }) =>
      resetUserPassword(id, newPassword),
    onSuccess: () => {
      /*
       * KHÔNG invalidate: mật khẩu không nằm trong bảng, danh sách không đổi
       * một chữ nào. Nạp lại chỉ để cho có là một truy vấn thừa.
       */
      toast.success("Đã đặt lại mật khẩu. Nhớ báo lại cho người dùng.");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Không đặt lại được mật khẩu."));
    },
  });
}

/*
 * Gỡ khoá tạm ngay, không chờ hết giờ.
 *
 * CÓ invalidate (khác `useResetUserPassword`): huy hiệu "Tạm khoá" và nút "Mở
 * khoá" đều đọc `locked_until` từ chính bảng này, không nạp lại thì admin bấm
 * xong vẫn thấy y nguyên dòng đang bị khoá và sẽ bấm tiếp.
 *
 * Toast nhắc luôn việc đổi mật khẩu: khoá tạm gần như chỉ nổ ra ở những mật
 * khẩu đoán được như `sale2026` — mở khoá là gỡ cho người dùng vào làm việc,
 * còn nguyên nhân thì vẫn nằm đó chờ lần dò tiếp theo.
 */
export function useUnlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => unlockUser(id),
    onSuccess: () => {
      toast.success(
        "Đã mở khoá. Nếu người dùng bị dò mật khẩu thì nên đặt lại mật khẩu khó đoán hơn.",
      );
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Không mở khoá được tài khoản."));
    },
  });
}
