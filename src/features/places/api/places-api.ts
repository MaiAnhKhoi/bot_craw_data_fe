import { api, buildApiUrl } from "@/lib/api";
import type { Page } from "@/types/common";
import type {
  ExportFormat,
  Place,
  PlaceCountry,
  PlaceQuery,
  PlaceFilters,
  PlaceListParams,
} from "@/features/places/types/place";

/*
 * Lớp API của module Địa điểm (docs/API_CONTRACT.md §3).
 * Lọc/sắp xếp/phân trang đều ở SERVER — không bao giờ tải hết rồi lọc ở client
 * (Rule 1): bảng lead có thể lên hàng trăm nghìn dòng.
 */

export async function listPlaces(
  params: PlaceListParams,
  signal?: AbortSignal,
): Promise<Page<Place>> {
  const response = await api.get<Page<Place>>("/places", { params, signal });
  return response.data;
}

/*
 * Danh mục quốc gia đang có mặt trong dữ liệu, server sắp sẵn theo số lượng
 * giảm dần — nước nhiều lead nhất nằm đầu dropdown, đúng thứ tự người dùng cần.
 *
 * Cố ý KHÔNG dựng danh sách này từ trang địa điểm đang xem: bảng chỉ có 50 dòng
 * của một trang, lọc theo nó thì mất luôn những nước không xuất hiện ở trang đó
 * (Rule 1 — mọi phép tính trên toàn bộ tập dữ liệu đều thuộc về server).
 */
export async function listPlaceQueries(
  signal?: AbortSignal,
): Promise<PlaceQuery[]> {
  const response = await api.get<PlaceQuery[]>("/places/queries", { signal });
  return response.data;
}

export async function listPlaceCountries(
  signal?: AbortSignal,
): Promise<PlaceCountry[]> {
  const response = await api.get<PlaceCountry[]>("/places/countries", {
    signal,
  });
  return response.data;
}

/** Đặt lại địa điểm về `pending` để worker quét lại. */
export async function reverifyPlace(id: number): Promise<Place> {
  const response = await api.post<Place>(`/places/${id}/reverify`);
  return response.data;
}

/*
 * URL tải file xuất khẩu.
 *
 * CỐ Ý không fetch blob: file có thể tới 100.000 dòng, tải hết vào RAM rồi mới
 * tạo link là cách chắc chắn làm treo tab. Thay vào đó trình duyệt tải thẳng
 * qua thẻ <a download>, hiện trong thanh tải xuống như mọi file khác.
 *
 * Hệ quả: thẻ <a> KHÔNG gắn được header `Authorization`, nên token đi kèm ở
 * query param giống endpoint SSE — same-origin qua rewrite của Next.
 * Nếu backend không chấp nhận token ở query cho endpoint này, đổi sang tạo link
 * tải một lần (signed URL) là cách sạch hơn cả — ghi rõ trong README.
 */
export function placesExportUrl(
  filters: PlaceFilters,
  format: ExportFormat,
  token: string,
): string {
  return buildApiUrl("/places/export", { ...filters, format, token });
}

/*
 * URL cho EventSource của bảng Địa điểm. Cùng ràng buộc với `placesExportUrl`
 * và `jobEventsUrl`: EventSource không gắn được header nên token đi ở query
 * param, và URL phải là đường tương đối qua rewrite `/api/*` của Next — dựng
 * URL tuyệt đối tới backend là vừa lộ token qua origin khác vừa dính CORS.
 */
export function placeEventsUrl(token: string): string {
  return buildApiUrl("/places/events", { token });
}
