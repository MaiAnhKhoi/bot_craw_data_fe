"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getAiStatus,
  localizeKeywords,
  saveKeywords,
} from "@/features/keyword/api/keyword-api";
import { STALE_TIME } from "@/lib/constants";

/*
 * Hook của module Từ khoá bản địa.
 *
 * Luật vận hành quan trọng nhất: `/keywords/localize` là MUTATION chứ không phải
 * query, dù bản chất nó chỉ đọc. Bọc bằng `useQuery` thì React Query sẽ tự gọi
 * lúc mount, lúc focus lại tab, lúc đổi tham số — mà mỗi lần gọi là một lần
 * tiêu tiền AI. Nó chỉ được chạy khi người dùng BẤM NÚT.
 *
 * `/keywords/save` cũng là mutation nhưng không invalidate gì cả: kết quả gợi ý
 * đang nằm trong state của form (người dùng đang sửa dở), nạp lại từ server sẽ
 * giật mất bản họ vừa gõ.
 */

export const keywordKeys = {
  all: ["keywords"] as const,
  status: () => ["keywords", "status"] as const,
};

/*
 * AI đã cấu hình khoá chưa — chỉ để hiện dòng nhắc, KHÔNG dùng để khoá nút
 * (backend vẫn trả từ khoá gốc kèm cảnh báo khi chưa có khoá).
 *
 * `enabled` để job quét trong nước không phải hỏi câu này: khối từ khoá bản địa
 * lúc đó không hiện, hỏi rồi bỏ đi là một request thừa mỗi lần mở form.
 */
export function useAiStatus(enabled = true) {
  return useQuery({
    queryKey: keywordKeys.status(),
    queryFn: ({ signal }) => getAiStatus(signal),
    enabled,
    staleTime: STALE_TIME.keywords,
  });
}

export function useLocalizeKeywords() {
  return useMutation({ mutationFn: localizeKeywords });
}

export function useSaveKeywords() {
  return useMutation({ mutationFn: saveKeywords });
}
