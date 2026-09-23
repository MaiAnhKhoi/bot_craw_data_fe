/*
 * Kiểu DTO của module Địa giới hành chính (backend `/geo/*`).
 *
 * Dữ liệu này là DANH MỤC THAM CHIẾU TĨNH ở backend (một file JSON được commit,
 * mỗi năm đổi một lần), không phải bảng nghiệp vụ. Vì vậy tầng hook cache nó với
 * `staleTime` rất dài thay vì gọi lại mỗi lần mở form.
 */

/** Mục chung của mọi cấp: mã + tên tiếng Việt đã sắp xếp sẵn ở server. */
export interface GeoItem {
  code: string;
  name: string;
}

export interface GeoCountry extends GeoItem {
  name_en: string;
  /** Mã châu lục (AS, EU...) — chỉ dùng để LỌC danh sách, không vào chuỗi địa điểm. */
  continent: string;
  /** 1 = chỉ có cấp quốc gia · 2 = có cấp tỉnh · 3 = có cả phường/xã (chỉ Việt Nam). */
  levels: number;
}

/*
 * Thân POST /geo/expand.
 * Mỗi cấp nhận: mã cụ thể · chuỗi "ALL" (tách ra từng mục ở cấp đó) · null/bỏ
 * trống (dừng ở cấp trên). Châu lục chỉ lọc danh sách quốc gia, không bao giờ
 * xuất hiện trong chuỗi địa điểm gửi cho Google Maps.
 */
export interface ExpandRequest {
  continent?: string | null;
  country?: string | null;
  province?: string | null;
  ward?: string | null;
}

export interface ExpandResponse {
  /** Danh sách đã cắt ở 5.000 dòng — xem `truncated`. */
  locations: string[];
  /** Tổng số THẬT, có thể lớn hơn `locations.length`. */
  total: number;
  truncated: boolean;
}
