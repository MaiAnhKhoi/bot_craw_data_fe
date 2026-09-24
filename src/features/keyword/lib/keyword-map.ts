import type { CountryKeywords } from "@/features/keyword/types";

/*
 * Phép tính THUẦN của module Từ khoá bản địa (không React, không API).
 *
 * Ba việc duy nhất ở đây:
 *  1. Đổi danh sách gợi ý theo quốc gia thành `keyword_map` gửi lên `/jobs`.
 *  2. Đổi danh mục ngành nghề đã duyệt thành `category_map` gửi cùng chỗ.
 *  3. Đếm số truy vấn THẬT khi mỗi quốc gia có bộ từ khoá riêng — người dùng
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
 * Nhãn ngành nghề chuẩn hoá y hệt từ khoá: gộp khoảng trắng thừa, bỏ nhãn rỗng,
 * bỏ trùng không phân biệt hoa thường. Một tên gọi riêng chứ không dùng thẳng
 * `normalizeKeywords` để nơi gọi đọc ra ngay mình đang làm việc với cái gì —
 * hai danh sách này nằm cạnh nhau trong cùng một khối giao diện.
 */
export function normalizeCategories(categories: string[]): string[] {
  return normalizeKeywords(categories);
}

/*
 * `category_map` gửi kèm `/jobs`: danh mục ngành nghề được phép của từng quốc gia.
 *
 * Khác `buildKeywordMap` ở đúng một chỗ, và chỗ đó quan trọng: KHÔNG bỏ quốc gia
 * `source === "original"` (Việt Nam). Từ khoá có bộ chung để rơi về, còn danh mục
 * thì KHÔNG — nước nào vắng mặt ở đây là nước đó không lọc gì cả. Bỏ Việt Nam ra
 * là lặng lẽ tắt bộ lọc ngay tại sân nhà.
 *
 * Danh mục rỗng thì bỏ hẳn khỏi map, đúng bằng nghĩa "không lọc nước này" mà
 * giao diện đã cảnh báo — gửi mảng rỗng lên là mời backend tự hiểu theo cách khác.
 */
export function buildCategoryMap(
  items: CountryKeywords[],
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const item of items) {
    const categories = normalizeCategories(item.categories ?? []);
    if (categories.length === 0) continue;
    map[item.country_code.toUpperCase()] = categories;
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
