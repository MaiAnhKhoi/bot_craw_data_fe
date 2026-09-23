import type { JobPhase } from "@/types/domain";

/* Kiểu của module Jobs — khớp docs/API_CONTRACT.md §2. */

export type { JobPhase };

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
