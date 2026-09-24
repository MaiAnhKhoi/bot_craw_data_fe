"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteKeywordSet,
  listKeywordSets,
  upsertKeywordSet,
} from "@/features/keyword/api/keyword-api";
import { keywordKeys } from "@/features/keyword/hooks/use-keywords";
import { errorMessage } from "@/lib/api";
import type { KeywordSet } from "@/features/keyword/types";

/*
 * Hook của "Bộ từ khoá đã lưu".
 *
 * Khác hẳn `/keywords/localize` ở file bên cạnh: mấy endpoint này KHÔNG chạm
 * tới AI, chỉ đọc/ghi một bảng danh sách nhỏ. Vì vậy chúng là query/mutation
 * bình thường, không cần rào chắn gì đặc biệt.
 *
 * Cố ý KHÔNG đặt `staleTime` riêng (dùng mặc định 10s của app): danh sách này
 * do chính người dùng sửa, và ô chọn chỉ tồn tại khi panel Tạo job đang mở —
 * mỗi lần mở panel tải lại một mảng vài chục dòng là cái giá quá rẻ so với
 * việc chọn nhầm một bộ đã bị xoá ở máy khác.
 */

export function useKeywordSets() {
  return useQuery({
    queryKey: keywordKeys.sets(),
    queryFn: ({ signal }) => listKeywordSets(signal),
  });
}

/*
 * Lưu bộ từ khoá. Trùng tên là GHI ĐÈ ở phía backend, nên nơi gọi phải hỏi
 * người dùng trước — hook này chỉ lo phần gửi đi và làm mới danh sách.
 */
export function useUpsertKeywordSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertKeywordSet,
    onSuccess: (set) => {
      toast.success(`Đã lưu bộ "${set.name}".`);
      queryClient.invalidateQueries({ queryKey: keywordKeys.sets() });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Không lưu được bộ từ khoá."));
    },
  });
}

/*
 * Nhận cả bản ghi (không chỉ `id`) để toast gọi đúng tên bộ vừa xoá — sau khi
 * danh sách được làm mới thì không còn chỗ nào tra ra cái tên đó nữa.
 */
export function useDeleteKeywordSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (set: KeywordSet) => deleteKeywordSet(set.id),
    onSuccess: (_result, set) => {
      toast.success(`Đã xoá bộ "${set.name}".`);
      queryClient.invalidateQueries({ queryKey: keywordKeys.sets() });
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Không xoá được bộ từ khoá."));
    },
  });
}
