import type { JobQueryStopReason } from "@/features/jobs/types/job";
import type { PageParams } from "@/types/common";

/* Kiểu của trang Địa bàn còn sót — khớp docs/API_CONTRACT.md §2. */

/*
 * Ba lý do dừng có nghĩa là "địa bàn này còn việc phải làm".
 *
 * Rút ra từ `JobQueryStopReason` bằng `Extract` chứ không gõ lại ba chuỗi: gõ
 * lại thì khi backend đổi tên một lý do, chỗ này vẫn biên dịch trót lọt và âm
 * thầm không khớp dòng nào nữa.
 */
export type RemainingStopReason = Extract<
  JobQueryStopReason,
  "cut_off" | "cap" | "unknown"
>;

/*
 * Một địa bàn còn sót. KHÔNG phải một dòng `job_queries`: backend đã gộp mọi
 * lần chạy của cùng một chuỗi truy vấn trên khắp các job rồi chỉ giữ lần quét
 * gần nhất — nên `job_id`/`job_name` là job của LẦN GẦN NHẤT, và cũng là job
 * chứa đúng những địa điểm mà con số `results_found` này nói tới.
 */
export interface RemainingArea {
  query: string;
  stop_reason: RemainingStopReason;
  results_found: number | null;
  finished_at: string | null;
  job_id: number;
  job_name: string;
}

export interface RemainingAreaListParams extends PageParams {
  stop_reason?: RemainingStopReason;
}
