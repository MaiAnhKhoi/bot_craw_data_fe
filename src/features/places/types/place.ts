/* Kiểu của module Địa điểm — khớp docs/API_CONTRACT.md §3. */

export type LivenessLabel = "ACTIVE" | "SUSPECT" | "DEAD";

export type BusinessStatus =
  | "OPERATIONAL"
  | "CLOSED_TEMPORARILY"
  | "CLOSED_PERMANENTLY";

export type WebsiteStatus = "OK" | "DEAD" | "PARKED" | "UNCHECKED" | "NONE";

/*
 * 4 trường bắt buộc theo yêu cầu nghiệp vụ: `name` (tên công ty),
 * `address` (vị trí), `phone` (số điện thoại), `website`.
 * Các trường còn lại phục vụ lọc và chấm sống/chết.
 */
export interface Place {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  phone_e164: string | null;
  phone_valid: boolean | null;
  website: string | null;
  website_status: WebsiteStatus;
  category: string | null;
  rating: number | null;
  review_count: number | null;
  business_status: BusinessStatus;
  /** 0..100. */
  liveness_score: number;
  liveness_label: LivenessLabel;
  /** Mã lý do — FE dịch sang tiếng Việt ở features/places/lib/liveness.ts. */
  liveness_reasons: string[];
  latest_review_days: number | null;
  lat: number | null;
  lng: number | null;
  maps_url: string | null;
  keywords: string[];
  detail_scraped: boolean;
  scraped_at: string | null;
  last_verified_at: string | null;
}

export type PlaceSort =
  | "liveness"
  | "name"
  | "rating"
  | "review_count"
  | "scraped_at"
  | "-liveness"
  | "-name"
  | "-rating"
  | "-review_count"
  | "-scraped_at";

/*
 * Bộ lọc dùng CHUNG cho `/places` và `/places/export` — giữ một kiểu duy nhất
 * để nút "Xuất Excel" không bao giờ tải ra tập khác với bảng đang xem.
 */
export interface PlaceFilters {
  q?: string;
  job_id?: number;
  keyword?: string;
  /** Lặp được: ?liveness=ACTIVE&liveness=SUSPECT */
  liveness?: LivenessLabel[];
  business_status?: BusinessStatus;
  has_phone?: boolean;
  has_website?: boolean;
  min_rating?: number;
  sort?: PlaceSort;
}

export interface PlaceListParams extends PlaceFilters {
  page?: number;
  size?: number;
}

export type ExportFormat = "xlsx" | "csv" | "json";
