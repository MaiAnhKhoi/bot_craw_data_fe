"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listRemainingAreas } from "@/features/remaining-areas/api/remaining-areas-api";
import { STALE_TIME } from "@/lib/constants";
import type { RemainingAreaListParams } from "@/features/remaining-areas/types/remaining-area";

export const remainingAreaKeys = {
  all: ["remaining-areas"] as const,
  list: (params: RemainingAreaListParams) =>
    ["remaining-areas", "list", params] as const,
};

/*
 * Danh sách địa bàn còn sót, PHÂN TRANG Ở SERVER.
 *
 * Cố ý KHÔNG tự làm mới định kỳ, khác bảng Job. Danh sách này chỉ đổi khi một
 * truy vấn chạy xong — mà một truy vấn tốn 1-3 phút — còn công việc thật sự ở
 * đây là ngồi đọc rồi quyết định chia nhỏ tỉnh nào. Bảng tự nhảy dòng giữa lúc
 * đang đọc thì hại nhiều hơn lợi.
 */
export function useRemainingAreas(params: RemainingAreaListParams) {
  return useQuery({
    queryKey: remainingAreaKeys.list(params),
    queryFn: ({ signal }) => listRemainingAreas(params, signal),
    staleTime: STALE_TIME.jobs,
    placeholderData: keepPreviousData,
  });
}
