import type { CountryKeywords } from "@/features/keyword/types";

/*
 * Phép tính THUẦN của module Từ khoá bản địa (không React, không API).
 *
 * Hai việc duy nhất ở đây:
 *  1. Đổi danh sách gợi ý theo quốc gia thành `keyword_map` gửi lên `/jobs`.
 *  2. Đếm số truy vấn THẬT khi mỗi quốc gia có bộ từ khoá riêng — người dùng
 *     phải thấy trước khối lượng công việc mình đặt ra, không chỉ phép nhân
 *     "từ khoá × địa điểm" như lúc chưa có bản địa hoá.
 */

/** Mã quốc gia nhà: dùng thẳng từ khoá gốc, không bao giờ vào `keyword_map`. */
export const HOME_COUNTRY_CODE = "VN";

/*
 * Chuẩn hoá giống hệt `normalize()` của backend: gộp khoảng trắng thừa, bỏ dòng
 * rỗng, bỏ trùng không phân biệt hoa thường. Làm ở cả hai đầu để con số truy vấn
 * hiện trên màn hình khớp đúng với số job thật sự chạy.
 */
export function normalizeKeywords(keywords: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of keywords) {
    const value = (raw ?? "").split(/\s+/).filter(Boolean).join(" ");
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

/*
 * `keyword_map` gửi kèm `/jobs`: từ khoá riêng cho từng quốc gia.
 *
 * BỎ quốc gia có `source === "original"` (Việt Nam) — ở đó backend dùng chung ô
 * `keywords`, nhét thêm vào map chỉ làm payload phình mà không đổi kết quả.
 * Cũng bỏ quốc gia người dùng xoá sạch từ khoá: gửi mảng rỗng lên sẽ thành
 * "không quét nước này", còn giữ nguyên ý mặc định thì mới đúng mong đợi.
 */
export function buildKeywordMap(
  items: CountryKeywords[],
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const item of items) {
    if (item.source === "original") continue;
    const keywords = normalizeKeywords(item.keywords);
    if (keywords.length === 0) continue;
    map[item.country_code.toUpperCase()] = keywords;
  }
  return map;
}

/*
 * Số truy vấn Google Maps sẽ sinh ra.
 *
 * Không còn là `số từ khoá × số địa điểm`: mỗi địa điểm dùng bộ từ khoá của
 * quốc gia nó thuộc về, nước nào không có bản riêng thì rơi về bộ từ khoá chung.
 * `locationCountryCodes` là mảng SONG SONG với danh sách địa điểm (`null` = không
 * nhận ra quốc gia, vd người dùng tự gõ "Quận 1").
 */
export function countQueries(
  locationCountryCodes: (string | null)[],
  keywordCount: number,
  keywordMap: Record<string, string[]>,
): number {
  // Không nhập địa điểm nào = một truy vấn cho mỗi từ khoá (backend không nhân).
  if (locationCountryCodes.length === 0) return keywordCount;

  let total = 0;
  for (const code of locationCountryCodes) {
    const own = code ? keywordMap[code] : undefined;
    total += own ? own.length : keywordCount;
  }
  return total;
}
