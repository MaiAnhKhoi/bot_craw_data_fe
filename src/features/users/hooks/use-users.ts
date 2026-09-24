"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listUsers } from "@/features/users/api/users-api";
import { useIsAdmin } from "@/features/auth/hooks/use-is-admin";
import { STALE_TIME } from "@/lib/constants";
import type { AccountListParams } from "@/features/users/types/user";

/*
 * Query key của module Quản lý tài khoản. Gom một chỗ để ba mutation (thêm,
 * sửa, đặt lại mật khẩu) nhắm đúng cache, không ai phải tự nặn mảng key.
 */
export const userKeys = {
  all: ["users"] as const,
  list: (params: AccountListParams) => ["users", "list", params] as const,
};

/*
 * Danh sách tài khoản, PHÂN TRANG Ở SERVER giống mọi bảng khác — dù mười dòng
 * thì một trang là hết, cứ đi đúng đường chung để sau này thêm người không phải
 * sửa gì.
 *
 * `enabled` theo vai trò: sale mà gõ thẳng /users lên thanh địa chỉ thì màn hình
 * đã chặn bằng một thông báo, nhưng hook vẫn được gọi (luật của React). Không
 * có cờ này thì mỗi lần như vậy là một request chắc chắn 403.
 */
export function useUsers(params: AccountListParams) {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: ({ signal }) => listUsers(params, signal),
    enabled: isAdmin,
    staleTime: STALE_TIME.users,
    placeholderData: keepPreviousData,
  });
}
