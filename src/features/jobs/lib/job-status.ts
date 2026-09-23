import type {
  DetailMode,
  JobQueryStatus,
  JobStatus,
} from "@/features/jobs/types/job";

/*
 * Bảng nhãn + màu của module Jobs. Cùng lý do với liveness bên Địa điểm:
 * backend chỉ trả mã, toàn bộ câu chữ tiếng Việt gom về một file để sửa chữ
 * không phải mở mười component.
 */

export const JOB_STATUS_META: Record<
  JobStatus,
  { label: string; badgeClass: string }
> = {
  queued: {
    label: "Đang chờ",
    badgeClass: "bg-muted text-muted-foreground",
  },
  running: {
    label: "Đang chạy",
    badgeClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  paused: {
    label: "Tạm dừng",
    badgeClass:
      "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
  },
  done: {
    label: "Hoàn tất",
    badgeClass:
      "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  },
  failed: {
    label: "Thất bại",
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  },
  cancelled: {
    label: "Đã huỷ",
    badgeClass: "bg-muted text-muted-foreground line-through",
  },
};

export const JOB_QUERY_STATUS_META: Record<
  JobQueryStatus,
  { label: string; className: string }
> = {
  pending: { label: "Chờ", className: "text-muted-foreground" },
  running: { label: "Đang chạy", className: "text-emerald-600 dark:text-emerald-400" },
  done: { label: "Xong", className: "text-foreground" },
  failed: { label: "Lỗi", className: "text-destructive" },
  skipped: { label: "Bỏ qua", className: "text-muted-foreground" },
};

export const DETAIL_MODE_OPTIONS: { value: DetailMode; label: string }[] = [
  { value: "missing_only", label: "Chỉ khi thiếu dữ liệu (khuyến nghị)" },
  { value: "always", label: "Luôn mở trang chi tiết (chậm, đầy đủ nhất)" },
  { value: "never", label: "Không mở trang chi tiết (nhanh nhất)" },
];

/** Các trạng thái cho phép từng hành động (docs/API_CONTRACT.md §2). */
export function canPause(status: JobStatus): boolean {
  return status === "running";
}

export function canResume(status: JobStatus): boolean {
  return status === "paused";
}

export function canCancel(status: JobStatus): boolean {
  return status === "queued" || status === "running" || status === "paused";
}

/*
 * Phần trăm tiến độ của một job.
 *
 * Ưu tiên đếm theo ĐỊA ĐIỂM vì đó là phần chiếm gần hết thời gian chạy; chỉ khi
 * job còn ở pha tìm kiếm (chưa biết tổng số địa điểm) mới rơi về đếm theo truy
 * vấn. Job đã kết thúc thì luôn là 100% — đừng để thanh tiến độ đứng ở 97% mãi
 * chỉ vì vài địa điểm bị bỏ qua.
 */
export function jobProgressPercent(job: {
  status: JobStatus;
  total_places: number;
  done_places: number;
  total_queries: number;
  done_queries: number;
}): number {
  if (job.status === "done") return 100;
  if (job.total_places > 0) {
    return Math.min(100, Math.round((job.done_places / job.total_places) * 100));
  }
  if (job.total_queries > 0) {
    return Math.min(
      100,
      Math.round((job.done_queries / job.total_queries) * 100),
    );
  }
  return 0;
}
