import { foldText } from "@/features/geo/lib/geo-selection";
import type { GeoCountry } from "@/features/geo/types";

/*
 * Suy ra quốc gia từ một chuỗi địa điểm — bản sao ĐÚNG NGUYÊN VĂN luật của
 * backend (`geo.resolve_country`): đọc ĐOẠN CUỐI trước, rồi mới thử cả chuỗi.
 *
 * Vì sao frontend cũng phải biết luật này, thay vì hỏi backend:
 *  - khối "Từ khoá bản địa" chỉ được hiện khi có quốc gia KHÁC Việt Nam, mà
 *    câu hỏi đó phải trả lời được TRƯỚC khi gọi API (mỗi lần gọi tốn tiền AI);
 *  - dòng đếm truy vấn phải biết mỗi địa điểm thuộc nước nào mới cộng đúng.
 *
 * Danh mục quốc gia lấy từ module geo (`GET /geo/countries`, 249 dòng, cache
 * vĩnh viễn) — đây là dữ liệu THAM CHIẾU dùng chung, không phải nội bộ của một
 * màn hình; form tạo job đã nạp sẵn nó cho bộ chọn địa giới nên ở đây không tốn
 * thêm request nào.
 *
 * Backend lập bảng tra từ ba tên: `name`, `name_en` và `query`. Đã kiểm trên
 * `geo.json`: cả 249 quốc gia đều có `query` trùng `name` hoặc `name_en`, nên
 * tra theo hai tên mà API trả về là đủ, không sót nước nào.
 */

export interface CountryIndex {
  /** Mã quốc gia của một dòng địa điểm, `null` nếu không nhận ra. */
  lookup(location: string): string | null;
}

function createCountryIndex(countries: GeoCountry[]): CountryIndex {
  const byName = new Map<string, string>();
  for (const country of countries) {
    for (const name of [country.name, country.name_en]) {
      if (!name) continue;
      const key = foldText(name);
      if (!byName.has(key)) byName.set(key, country.code);
    }
  }

  /*
   * Đệm kết quả theo từng dòng: danh sách địa điểm có thể tới 5.000 dòng và được
   * tra lại ở mỗi lần gõ phím trong form. `foldText` phải chạy `normalize("NFD")`
   * nên không rẻ; đệm một lần rồi thôi (danh mục quốc gia bất biến nên an toàn).
   */
  const cache = new Map<string, string | null>();

  return {
    lookup(location: string): string | null {
      const cached = cache.get(location);
      if (cached !== undefined) return cached;

      const parts = location
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      const candidates = parts.length > 0 ? [parts[parts.length - 1]] : [];
      // Thử cả chuỗi sau cùng, cho trường hợp chỉ ghi mỗi tên nước.
      candidates.push(location.trim());

      let found: string | null = null;
      for (const candidate of candidates) {
        const code = byName.get(foldText(candidate));
        if (code) {
          found = code;
          break;
        }
      }
      cache.set(location, found);
      return found;
    },
  };
}

/*
 * Một bảng tra DÙNG CHUNG cho mỗi mảng quốc gia.
 *
 * Form tạo job hỏi cùng câu hỏi ở hai chỗ (khối từ khoá bản địa + dòng đếm truy
 * vấn). TanStack Query trả về cùng một mảng `data` cho cả hai, nên khoá theo
 * chính mảng đó giúp hai nơi xài chung một bộ đệm thay vì tính hai lần.
 * `WeakMap` để mảng cũ bị thu hồi thì bảng tra cũng đi theo.
 */
const indexByCountries = new WeakMap<GeoCountry[], CountryIndex>();

export function getCountryIndex(
  countries: GeoCountry[] | undefined,
): CountryIndex | null {
  if (!countries || countries.length === 0) return null;
  const existing = indexByCountries.get(countries);
  if (existing) return existing;
  const created = createCountryIndex(countries);
  indexByCountries.set(countries, created);
  return created;
}
