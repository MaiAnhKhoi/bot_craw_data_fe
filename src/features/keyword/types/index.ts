/*
 * Kiểu DTO của module Từ khoá bản địa (backend `/keywords/*`).
 *
 * Vì sao module này tồn tại: từ khoá tiếng Việt gần như vô dụng khi quét nước
 * ngoài. Đo thật — "xuất nhập khẩu trái cây Bangkok" với gl=vn ra 2 kết quả và
 * cả hai đều ở TP.HCM; "fruit wholesaler Bangkok" với gl=th ra 60+ kết quả Thái
 * Lan. Backend đã tự chọn hl/gl theo từng địa điểm; phần còn lại là để người
 * dùng DUYỆT từ khoá bản địa trước khi chạy job.
 *
 * Khớp docs/API_CONTRACT.md §6.
 */

/**
 * Nguồn của bộ từ khoá một quốc gia:
 * - `original`  Việt Nam, dùng thẳng từ khoá gốc (không dịch)
 * - `ai`        vừa sinh bằng AI
 * - `cache`     lấy từ bộ nhớ đệm của lần trước
 * - `user`      bản người dùng đã sửa tay, AI không ghi đè
 * - `fallback`  không dịch được → tạm dùng từ khoá gốc (xem `warning`)
 */
export type KeywordSource = "ai" | "cache" | "user" | "original" | "fallback";

export interface CountryKeywords {
  /** Mã ISO alpha-2, vd "TH". Cũng là khoá của `keyword_map` gửi lên /jobs. */
  country_code: string;
  country_name: string;
  /** Ngôn ngữ của bộ từ khoá này ("th", "en", "vi") — chỉ để hiển thị và lưu lại. */
  language: string;
  keywords: string[];
  source: KeywordSource;
}

export interface AiStatus {
  ai_available: boolean;
}

export interface LocalizeRequest {
  keywords: string[];
  /** Quốc gia được suy ra từ ĐUÔI mỗi dòng địa điểm. */
  locations?: string[];
  /** Hoặc truyền thẳng mã quốc gia ISO alpha-2. */
  countries?: string[];
}

export interface LocalizeResponse {
  items: CountryKeywords[];
  ai_available: boolean;
  /** Câu cảnh báo tiếng Việt từ backend — hiện nguyên văn, đừng tự viết lại. */
  warning: string | null;
}

export interface SaveRequest {
  /** Bộ từ khoá GỐC — backend dùng nó để tính khoá đệm, không phải bản đã sửa. */
  keywords: string[];
  country_code: string;
  language: string;
  translated: string[];
}

export interface SaveResponse {
  saved: true;
}
