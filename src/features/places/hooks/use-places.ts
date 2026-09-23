"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listPlaces } from "@/features/places/api/places-api";
import { STALE_TIME } from "@/lib/constants";
import type { PlaceListParams } from "@/features/places/types/place";

export const placeKeys = {
  all: ["places"] as const,
  list: (params: PlaceListParams) => ["places", "list", params] as const,
};

/*
 * Danh sách địa điểm — phân trang/sort/lọc HOÀN TOÀN ở server.
 *
 * `placeholderData: keepPreviousData`: khi đổi trang hay gõ từ khoá, bảng giữ
 * nguyên dữ liệu cũ và chỉ mờ đi trong lúc chờ, thay vì nháy về skeleton. Đây
 * là mẹo "cảm giác nhanh" rẻ nhất cho màn danh sách (Rule 1, đòn bẩy 2).
 */
export function usePlaces(params: PlaceListParams) {
  return useQuery({
    queryKey: placeKeys.list(params),
    queryFn: ({ signal }) => listPlaces(params, signal),
    staleTime: STALE_TIME.places,
    placeholderData: keepPreviousData,
  });
}
