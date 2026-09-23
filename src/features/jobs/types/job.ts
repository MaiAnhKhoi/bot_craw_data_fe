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
  hl?: string;
  gl?: string;
  region?: string;
  max_results_per_query?: number;
  detail_mode?: DetailMode;
  enrich_website?: boolean;
  ttl_days?: number;
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

export interface JobQuery {
  id: number;
  query: string;
  status: JobQueryStatus;
  results_found: number | null;
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
