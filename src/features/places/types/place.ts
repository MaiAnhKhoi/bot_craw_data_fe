/* Kiểu của module Địa điểm — khớp docs/API_CONTRACT.md §3. */

export type LivenessLabel = "ACTIVE" | "SUSPECT" | "DEAD";

export type BusinessStatus =
  | "OPERATIONAL"
  | "CLOSED_TEMPORARILY"
  | "CLOSED_PERMANENTLY";

export type WebsiteStatus = "OK" | "DEAD" | "PARKED" | "UNCHECKED" | "NONE";

/*
 * Trạng thái CHĂM SÓC của bên mình. Khác hẳn `liveness_label` (máy chấm doanh
 * nghiệp còn sống không) — cái này do người ghi lại sau khi gọi. Không có nó thì
 * mỗi lần quét lại là sale gọi trùng, mà ở 15-30k lead thì gọi trùng không phải
 * rủi ro, là chuyện chắc chắn xảy ra.
 */
export type ContactStatus = "new" | "called" | "interested" | "rejected";

/*
 * 4 trường bắt buộc theo yêu cầu nghiệp vụ: `name` (tên công ty),
 * `address` (vị trí), `phone` (số điện thoại), `website`.
 * Các trường còn lại phục vụ lọc và chấm sống/chết.
 */
export interface Place {
  id: number;
  name: string;
  /**
   * ĐỊA CHỈ ĐẦY ĐỦ, hoặc null. Chỉ lấy từ trang chi tiết của Google nên luôn có
   * đủ đường/phường/tỉnh/quốc gia. KHÔNG bao giờ là một mẩu.
   */
  address: string | null;
  /**
   * Mẩu địa chỉ trên thẻ kết quả ("Phan Huy Ích"), chỉ có ý nghĩa khi `address`
   * còn null. Đo thật: 39% số dòng chưa mở chi tiết không có cả mẩu này, phần
   * còn lại dài trung bình 20 ký tự. Phải hiện kèm dấu hiệu CHƯA ĐẦY ĐỦ —
   * trộn nó vào cùng một ô như địa chỉ thật chính là gốc của chuyện "ô địa chỉ
   * lúc rỗng lúc hiện không đầy đủ".
   */
  address_short: string | null;
  /** ISO alpha-2, ví dụ "TH". Có thể null với dữ liệu quét trước bản V0003. */
  country_code: string | null;
  /** Tên tiếng Việt do backend tra sẵn, ví dụ "Thái Lan". */
  country_name: string | null;
  /**
   * NGUỒN đã xác định ra quốc gia. Quan trọng vì đây là một PHỎNG ĐOÁN:
   *   address  đọc từ tên nước ở đuôi địa chỉ — chắc chắn nhất
   *   coords   toạ độ nằm trong biên giới nước nào — rất đáng tin, sai số ~1-2km
   *            ở sát biên giới
   *   gl       đoán theo nước đang tìm — YẾU NHẤT, chỉ khi không còn gì khác
   * Quốc gia sai kéo theo số điện thoại nội địa đọc sai vùng, mà số sai đó vẫn
   * "hợp lệ" nên không có gì báo. Hiện nguồn ra để người dùng soi được.
   */
  country_source: "address" | "coords" | "gl" | null;
  /**
   * Quốc gia mà SỐ ĐIỆN THOẠI thuộc về. Lệch với `country_code` KHÔNG phải lỗi:
   * doanh nghiệp Thái niêm yết số di động Việt Nam là chuyện thật trong ngành
   * xuất nhập khẩu — thường là đầu mối có người Việt phụ trách, tức lead tốt hơn.
   */
  phone_country_code: string | null;
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
  /** Luôn có giá trị — backend mặc định "new", không bao giờ null. */
  contact_status: ContactStatus;
  contact_note: string | null;
  /**
   * ISO. Chỉ đổi khi TRẠNG THÁI đổi, KHÔNG đổi khi chỉ sửa ghi chú — nhờ vậy nó
   * trả lời đúng một câu hỏi "gọi lần gần nhất là bao giờ", không bị việc sửa
   * chính tả trong ghi chú đẩy ngày lên.
   */
  contact_at: string | null;
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
  /** Mã ISO alpha-2 ("TH"). Bỏ trống = không lọc theo quốc gia. */
  country?: string;
  /**
   * Một trạng thái chăm sóc, bỏ trống = không lọc. Backend trả danh sách RỖNG
   * với giá trị lạ (không phải lỗi), nên ô lọc chỉ cần đưa ra đúng bốn mã.
   */
  contact_status?: ContactStatus;
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

/*
 * Một dòng của danh mục quốc gia ĐANG CÓ TRONG DỮ LIỆU (GET /places/countries).
 *
 * Khác hẳn danh mục của module Địa giới: bên đó là toàn bộ 249 quốc gia trên
 * đời (dùng để ĐẶT job quét), còn đây chỉ những nước đã thật sự quét ra lead.
 * Nhờ vậy ô lọc không bao giờ đưa ra lựa chọn dẫn tới bảng rỗng.
 */
/*
 * Một LƯỢT TÌM đã sinh ra dữ liệu. `query` là cả chuỗi truy vấn
 * ("fruit wholesaler Phuket, Thailand"), tức là đúng thứ đã gửi lên Google Maps —
 * không phải riêng từ khoá. Đây là thứ duy nhất trả lời được "địa điểm này ra từ
 * lượt tìm nào", nên nó cũng chính là giá trị của bộ lọc `keyword`.
 */
export interface PlaceQuery {
  query: string;
  count: number;
}

export interface PlaceCountry {
  /** ISO alpha-2, khớp `Place.country_code`. */
  code: string;
  /** Tên tiếng Việt do backend tra sẵn, khớp `Place.country_name`. */
  name: string;
  /** Số địa điểm hiện có của nước này — hiện kèm trong nhãn ô lọc. */
  count: number;
}

export type ExportFormat = "xlsx" | "csv" | "json";
