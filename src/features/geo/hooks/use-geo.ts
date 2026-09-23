"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  expandLocations,
  listContinents,
  listCountries,
  listProvinces,
  listWards,
} from "@/features/geo/api/geo-api";
import { GEO_ALL, GEO_SKIP } from "@/features/geo/lib/geo-selection";
import { STALE_TIME } from "@/lib/constants";
import type { ExpandRequest } from "@/features/geo/types";

/*
 * Hook đọc danh mục địa giới hành chính.
 *
 * Hai nguyên tắc chi phối cả file (Rule 1 — tầng dữ liệu là đòn bẩy nặng nhất):
 *
 * 1. Dữ liệu gần như BẤT BIẾN nên `staleTime` là vô hạn và `gcTime` 24 giờ:
 *    mở form tạo job mười lần trong ngày vẫn chỉ tốn đúng một request mỗi cấp.
 * 2. `enabled` chặn đúng chỗ: KHÔNG bao giờ tải 3.321 phường/xã khi chưa chọn
 *    tỉnh, không tải tỉnh khi quốc gia đang là "Tất cả" (không có mã để hỏi).
 *
 * Mỗi cấp tải trọn danh sách một lần rồi để combobox lọc tại chỗ — mỗi cấp nhiều
 * nhất ~250 mục, rẻ hơn hẳn việc bắn một request cho mỗi phím gõ.
 */

const GEO_GC_TIME = 24 * 60 * 60 * 1000;

export const geoKeys = {
  all: ["geo"] as const,
  continents: () => ["geo", "continents"] as const,
  countries: (continent: string) => ["geo", "countries", continent] as const,
  provinces: (country: string) => ["geo", "provinces", country] as const,
  wards: (province: string) => ["geo", "wards", province] as const,
  expand: (request: ExpandRequest | null) => ["geo", "expand", request] as const,
};

/** Mã "thật" của một cấp, hay `null` nếu đang là Tất cả / bỏ qua / chưa chọn. */
function concreteCode(value: string | null | undefined): string | null {
  if (!value || value === GEO_ALL || value === GEO_SKIP) return null;
  return value;
}

export function useContinents() {
  return useQuery({
    queryKey: geoKeys.continents(),
    queryFn: ({ signal }) => listContinents(signal),
    staleTime: STALE_TIME.geo,
    gcTime: GEO_GC_TIME,
  });
}

/** Danh sách quốc gia, lọc theo châu lục. `GEO_ALL` = toàn bộ 249 quốc gia. */
export function useCountries(continent: string) {
  return useQuery({
    queryKey: geoKeys.countries(continent),
    queryFn: ({ signal }) =>
      listCountries({ continent: continent === GEO_ALL ? null : continent }, signal),
    staleTime: STALE_TIME.geo,
    gcTime: GEO_GC_TIME,
  });
}

/** Tỉnh/thành của MỘT quốc gia cụ thể — "Tất cả quốc gia" thì không có gì để hỏi. */
export function useProvinces(country: string | null) {
  const code = concreteCode(country);
  return useQuery({
    queryKey: geoKeys.provinces(code ?? ""),
    queryFn: ({ signal }) => listProvinces({ country: code ?? "" }, signal),
    enabled: code !== null,
    staleTime: STALE_TIME.geo,
    gcTime: GEO_GC_TIME,
  });
}

/** Phường/xã của MỘT tỉnh cụ thể. Ngoài Việt Nam, endpoint trả mảng rỗng. */
export function useWards(province: string | null) {
  const code = concreteCode(province);
  return useQuery({
    queryKey: geoKeys.wards(code ?? ""),
    queryFn: ({ signal }) => listWards({ province: code ?? "" }, signal),
    enabled: code !== null,
    staleTime: STALE_TIME.geo,
    gcTime: GEO_GC_TIME,
  });
}

/*
 * Xem trước danh sách địa điểm của lựa chọn hiện tại.
 *
 * Là POST nhưng bản chất chỉ ĐỌC và kết quả tất định, nên bọc bằng `useQuery`:
 * đổi tới đổi lui giữa hai lựa chọn không bắn thêm request nào. `keepPreviousData`
 * giữ con số cũ trong lúc tính lại để khối xem trước không nháy về rỗng.
 */
export function useExpandedLocations(request: ExpandRequest | null) {
  return useQuery({
    queryKey: geoKeys.expand(request),
    queryFn: ({ signal }) => expandLocations(request ?? {}, signal),
    enabled: request !== null,
    staleTime: STALE_TIME.geo,
    gcTime: GEO_GC_TIME,
    placeholderData: keepPreviousData,
  });
}
