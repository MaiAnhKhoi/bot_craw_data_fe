"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  listPlaceCountries,
  listPlaceQueries,
  listPlaces,
} from "@/features/places/api/places-api";
import { STALE_TIME } from "@/lib/constants";
import type { PlaceListParams } from "@/features/places/types/place";

export const placeKeys = {
  all: ["places"] as const,
  list: (params: PlaceListParams) => ["places", "list", params] as const,
  countries: () => ["places", "countries"] as const,
  queries: () => ["places", "queries"] as const,
};

/*
 * Danh sách địa điểm — phân trang/sort/lọc HOÀN TOÀN ở server.
 *
 * `placeholderData: keepPreviousData`: khi đổi trang hay gõ từ khoá, bảng giữ
 * nguyên dữ liệu cũ và chỉ mờ đi trong lúc chờ, thay vì nháy về skeleton. Đây
 * là mẹo "cảm giác nhanh" rẻ nhất cho màn danh sách (Rule 1, đòn bẩy 2).
 */
export function usePlaces(params: PlaceListParams) {
  /*
   * KHÔNG có `refetchInterval` ở đây là có chủ ý.
   *
   * Bảng này vẫn cập nhật theo thời gian thực trong lúc worker cào, nhưng tín
   * hiệu đến từ SSE (`usePlaceEvents`): backend chỉ bắn tin khi dữ liệu THẬT SỰ
   * đổi, rồi hook kia gọi invalidate. Đặt thêm nhịp hỏi ở đây là chạy song song
   * hai cơ chế cho cùng một việc — mỗi lượt hỏi kéo theo câu truy vấn danh sách
   * đầy đủ (lọc + sắp + đếm phân trang) trên bảng có thể hàng trăm nghìn dòng,
   * kể cả khi không có gì mới.
   */
  return useQuery({
    queryKey: placeKeys.list(params),
    queryFn: ({ signal }) => listPlaces(params, signal),
    staleTime: STALE_TIME.places,
    placeholderData: keepPreviousData,
  });
}

/*
 * Danh mục quốc gia có trong dữ liệu — nguồn cho ô lọc "Quốc gia".
 *
 * `staleTime` lấy mức dữ liệu THAM CHIẾU (5 phút) chứ không phải mức của bảng
 * địa điểm (10 giây): danh mục chỉ đổi khi một job quét xong ở nước mới, nên
 * bắn lại request mỗi lần người dùng đổi trang hay đổi bộ lọc là lãng phí thuần
 * — dropdown vẫn ra đúng chừng ấy dòng (Rule 1).
 *
 * KHÔNG dùng `STALE_TIME.geo` (vô hạn) dù cũng là danh mục quốc gia: bên đó là
 * file tĩnh được commit, còn cái này sinh ra từ dữ liệu quét nên vẫn cũ đi được.
 */
/*
 * Mọi LƯỢT TÌM đã sinh ra dữ liệu — nguồn cho ô lọc "Lượt tìm".
 *
 * Nằm trong nhóm key `places` nên SSE (`usePlaceEvents`) invalidate cả nhóm là
 * danh sách này tự cập nhật: quét xong một địa bàn mới thì ô lọc có ngay mục mới,
 * không phải tải lại trang.
 */
export function usePlaceQueries() {
  return useQuery({
    queryKey: placeKeys.queries(),
    queryFn: ({ signal }) => listPlaceQueries(signal),
    staleTime: STALE_TIME.keywords,
  });
}

export function usePlaceCountries() {
  return useQuery({
    queryKey: placeKeys.countries(),
    queryFn: ({ signal }) => listPlaceCountries(signal),
    staleTime: STALE_TIME.keywords,
  });
}
