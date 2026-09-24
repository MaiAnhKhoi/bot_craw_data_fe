import type { PageParams } from "@/types/common";
import type { JobPhase, RelevanceSource } from "@/types/domain";

/* Kiểu của module Jobs — khớp docs/API_CONTRACT.md §2. */

export type { JobPhase, RelevanceSource };

export type JobStatus =
  | "queued"
  | "running"
  | "paused"
  | "done"
  | "failed"
  | "cancelled";

export type DetailMode = "always" | "missing_only" | "never";

export interface JobCreate {
  name: string;
  /** Bắt buộc, tối thiểu 1 từ khoá. */
  keywords: string[];
  /** Nhân tổ hợp với keywords (mỗi cặp từ khoá × địa điểm là một truy vấn). */
  locations?: string[];
  /*
   * Từ khoá RIÊNG theo mã quốc gia, vd `{"TH": ["fruit wholesaler"]}`.
   * Địa điểm thuộc quốc gia có mặt ở đây dùng bộ từ khoá này thay cho `keywords`;
   * nước nào không khai thì vẫn dùng `keywords` chung.
   */
  keyword_map?: Record<string, string[]>;
  /*
   * DANH MỤC NGÀNH NGHỀ được phép, theo mã quốc gia — cùng cấu trúc `keyword_map`,
   * vd `{"IN": ["Fruit and vegetable wholesaler", "Produce market"]}`.
   *
   * Địa điểm có ngành nghề NGOÀI danh mục của nước nó thuộc về bị loại ngay lúc
   * quét, không ghi vào bảng (vẫn ghi riêng để soi — xem `rejected_count`).
   * Nước nào KHÔNG có mặt ở đây thì không lọc gì cả, mọi kết quả Google trả về
   * đều được ghi.
   *
   * Người dùng KHÔNG nhìn thấy và không sửa được danh mục này — nó do bước gợi
   * ý từ khoá bản địa sinh ra rồi gửi thẳng lên. Nhưng vẫn phải gửi: bỏ trường
   * này đi là tắt luôn bộ lọc ở backend.
   */
  category_map?: Record<string, string[]>;
  hl?: string;
  gl?: string;
  region?: string;
  max_results_per_query?: number;
  detail_mode?: DetailMode;
  enrich_website?: boolean;
  ttl_days?: number;
  skip_recent_queries?: boolean;
}

export interface Job {
  id: number;
  name: string;
  status: JobStatus;
  phase: JobPhase;
  params: JobCreate;
  total_queries: number;
  done_queries: number;
  total_places: number;
  done_places: number;
  failed_places: number;
  new_places: number;
  blocked_count: number;
  /*
   * Số địa điểm bị LOẠI vì ngành nghề nằm ngoài `category_map`. Khác hẳn
   * `failed_places` (lỗi khi quét) và `blocked_count` (Google chặn): đây là
   * những dòng bộ lọc cố tình bỏ đi.
   *
   * KHÔNG hiện ra màn hình nào — bộ lọc là hạ tầng ngầm. Giữ khai báo để khi
   * nghi bộ lọc siết quá tay thì còn con số mà đọc trong payload.
   */
  rejected_count: number;
  rate_per_min: number | null;
  started_at: string | null;
  finished_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export type JobQueryStatus =
  | "pending"
  | "running"
  | "done"
  | "failed"
  | "skipped";

/*
 * Vì sao vòng cuộn danh sách kết quả dừng lại. Đây mới là thứ trả lời được
 * "địa bàn này đã quét hết chưa?" — `results_found` một mình thì không:
 * 95 kết quả kèm `exhausted` là xong, 95 kết quả kèm `cut_off` là còn sót.
 */
export type JobQueryStopReason =
  | "exhausted"
  | "cut_off"
  | "cap"
  | "empty"
  | "unknown"
  /* Không phải lý do của vòng cuộn: truy vấn chưa hề chạy, bị bỏ qua vì chính
     nó đã chạy xong trong `ttl_days` ngày gần đây. */
  | "recent";

export interface JobQuery {
  id: number;
  query: string;
  status: JobQueryStatus;
  results_found: number | null;
  stop_reason: JobQueryStopReason | null;
  error: string | null;
}

export interface JobDetail extends Job {
  queries: JobQuery[];
}

export interface JobListParams {
  page?: number;
  size?: number;
  status?: JobStatus;
}

/*
 * Một địa điểm đã BỊ LOẠI vì ngành nghề ngoài danh mục (`GET /jobs/{id}/rejects`).
 *
 * Cố ý nhẹ hơn `Place`: những dòng này không được ghi vào bảng địa điểm nên
 * không có điểm sống/chết, không có số điện thoại, không có gì để chăm sóc.
 *
 * KHÔNG màn hình nào gọi endpoint này nữa — bộ lọc ngành nghề là hạ tầng ngầm.
 * Giữ khai báo vì backend vẫn phục vụ nó và đây là đường duy nhất soi được
 * những dòng bộ lọc đã vứt, khi nghi nó siết quá tay.
 */
export interface JobReject {
  id: number;
  /** Cả chuỗi truy vấn đã tìm ra nó, vd "fruit wholesaler Port Blair, India". */
  query: string;
  name: string;
  /** Ngành nghề Google gắn cho nó — chính là lý do bị loại. */
  category: string | null;
  /**
   * AI hay luật cứng đã loại dòng này (xem `RelevanceSource`). Đáng đọc khi đi
   * truy: bị luật cứng loại thì chữa bằng cách nới danh mục ngành nghề, còn bị
   * AI loại thì danh mục không liên quan — hai cách chữa khác hẳn nhau.
   */
  source: RelevanceSource | null;
  /** Câu giải thích của AI. Chỉ có khi `source === "ai"`. */
  reason: string | null;
  maps_url: string | null;
  created_at: string;
}

export type JobRejectListParams = PageParams;

/*
 * Payload của sự kiện SSE `event: progress` — CHỈ là phần tiến độ của Job,
 * không phải cả bản ghi. Hook useJobEvents vá nó vào cache thay vì thay cả
 * object, nếu không các trường tĩnh (name, params...) sẽ biến mất.
 */
export type JobProgressEvent = Pick<
  Job,
  | "id"
  | "status"
  | "phase"
  | "total_queries"
  | "done_queries"
  | "total_places"
  | "done_places"
  | "failed_places"
  | "new_places"
  | "blocked_count"
  | "rate_per_min"
  | "updated_at"
>;

/** Payload của `event: done` — chỉ đủ để biết job đã kết thúc ở trạng thái nào. */
export interface JobDoneEvent {
  id: number;
  status: JobStatus;
}
