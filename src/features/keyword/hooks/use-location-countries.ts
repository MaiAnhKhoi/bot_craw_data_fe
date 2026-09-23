"use client";

import { useMemo } from "react";
import { useCountries } from "@/features/geo/hooks/use-geo";
import { GEO_ALL } from "@/features/geo/lib/geo-selection";
import { getCountryIndex } from "@/features/keyword/lib/country-index";

/*
 * "Danh sách địa điểm này chạm vào những quốc gia nào?"
 *
 * Câu hỏi này có hai nơi cần: khối gợi ý từ khoá bản địa (chỉ hiện khi có nước
 * ngoài Việt Nam) và dòng đếm số truy vấn (mỗi nước có thể có bộ từ khoá riêng).
 * Gom vào một hook để luật suy ra quốc gia chỉ nằm đúng một chỗ.
 *
 * Danh mục quốc gia dùng lại hook của module geo — `staleTime: Infinity`, và form
 * tạo job đã nạp sẵn nó cho bộ chọn địa giới, nên bình thường KHÔNG tốn thêm
 * request nào (Rule 1: dữ liệu tham chiếu tĩnh thì nạp một lần cho cả phiên).
 */

export interface LocationCountries {
  /** Mã quốc gia của từng dòng, SONG SONG với `locations`. `null` = không nhận ra. */
  codeByLocation: (string | null)[];
  /** Các mã quốc gia gặp được, giữ thứ tự xuất hiện đầu tiên. */
  codes: string[];
  /** Danh mục quốc gia đã tải xong chưa — chưa xong thì hai mảng trên còn rỗng. */
  ready: boolean;
}

export function useLocationCountries(locations: string[]): LocationCountries {
  const countries = useCountries(GEO_ALL);
  const index = getCountryIndex(countries.data);

  return useMemo(() => {
    if (index === null) {
      /*
       * Danh mục chưa về: trả `null` cho MỌI dòng chứ không trả mảng rỗng. Mảng
       * rỗng nghĩa là "không có địa điểm nào", và dòng đếm truy vấn sẽ hiện sai
       * số trong khoảnh khắc chờ tải.
       */
      return { codeByLocation: locations.map(() => null), codes: [], ready: false };
    }
    const codeByLocation = locations.map((line) => index.lookup(line));
    const codes: string[] = [];
    for (const code of codeByLocation) {
      if (code && !codes.includes(code)) codes.push(code);
    }
    return { codeByLocation, codes, ready: true };
  }, [index, locations]);
}
