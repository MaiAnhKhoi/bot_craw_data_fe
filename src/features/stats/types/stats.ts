import type { JobPhase } from "@/types/domain";

/* Kiểu của module Thống kê — khớp docs/API_CONTRACT.md §4. */

export interface Overview {
  total: number;
  done: number;
  pending: number;
  failed: number;
  by_liveness: {
    ACTIVE: number;
    SUSPECT: number;
    DEAD: number;
  };
  /** Số DÒNG có dữ liệu ở từng trường (không phải phần trăm). */
  completeness: {
    phone: number;
    website: number;
    address: number;
  };
  today_new: number;
  last_14_days: { date: string; count: number }[];
  top_keywords: { keyword: string; count: number }[];
}

export interface WorkerStatus {
  alive: boolean;
  last_heartbeat: string | null;
  current_job_id: number | null;
  current_phase: JobPhase;
  /** Khoảng nghỉ hiện tại giữa 2 trang (giây). */
  pace_seconds: number;
  blocked_today: number;
  pages_last_hour: number;
  /** Đang trong khung giờ nghỉ đêm. */
  night_rest: boolean;
}
