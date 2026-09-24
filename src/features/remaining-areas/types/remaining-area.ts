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

/*
 * Sinh MỘT job mới từ các dòng đang chọn.
 *
 * Cố ý chỉ gửi chuỗi truy vấn, không gửi kèm `stop_reason` đang hiện trên bảng:
 * backend tra lại lý do dừng của lần quét gần nhất rồi mới quyết định việc phải
 * làm. Trang này không tự làm mới, nên nó có thể đã mở từ sáng trong khi một job
 * khác vừa quét lại xong chính địa bàn đó.
 */
export interface RemainingSplitRequest {
  queries: string[];
  /** Bỏ trống thì backend đặt theo ngày giờ. */
  name?: string;
  /** Trần kết quả của job mới — thứ duy nhất các dòng "Chạm trần" cần. */
  max_results_per_query?: number;
}

/* Việc backend sẽ làm với một dòng (docs/API_CONTRACT.md §2). */
export type SplitAction = "subdivide" | "raise_cap" | "retry" | "skip";

/** Cấp hành chính của địa bàn hiện tại; null khi không tách ra được. */
export type SplitLevel = "country" | "province" | "ward";

export interface SplitPlanItem {
  query: string;
  stop_reason: RemainingStopReason | null;
  hanh_dong: SplitAction;
  tu_khoa: string | null;
  dia_diem: string | null;
  cap: SplitLevel | null;
  so_truy_van: number;
  /*
   * Vì sao dòng này không sinh ra truy vấn nào. Luôn hiện nguyên văn cho người
   * dùng: im lặng bỏ qua là người ta bấm tạo, thấy job chạy, rồi ba tiếng sau
   * mới biết tỉnh mình cần lại không hề có trong đó.
   */
  ly_do: string | null;
}

export interface SplitPlan {
  items: SplitPlanItem[];
  total_queries: number;
  skipped: number;
  /** Ước tính ~40 giây mỗi truy vấn, đã làm tròn lên. */
  estimated_minutes: number;
}
