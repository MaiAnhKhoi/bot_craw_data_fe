import type {
  DetailMode,
  JobQueryStatus,
  JobQueryStopReason,
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

/*
 * Nhãn cho lý do dừng. `hint` là câu trả lời cho câu hỏi thực sự của người dùng:
 * "có phải chia nhỏ địa bàn này ra không?" — nên nó nằm ngay trong tooltip chứ
 * không bắt người ta tự suy từ con số kết quả.
 */
export const STOP_REASON_META: Record<
  JobQueryStopReason,
  { label: string; className: string; hint: string }
> = {
  exhausted: {
    label: "Đã quét hết",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
    hint: "Google báo hết danh sách. Địa bàn này đã lấy trọn, không cần chia nhỏ.",
  },
  cut_off: {
    label: "Google cắt",
    className:
      "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
    hint: "Google ngừng trả thêm kết quả dù còn. Chia nhỏ địa bàn (xuống tỉnh, rồi phường/xã) để lấy tiếp.",
  },
  cap: {
    label: "Chạm trần",
    className:
      "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
    hint: "Dừng vì chạm trần 'Kết quả tối đa / truy vấn' của chính bạn, không phải do Google. Nâng trần rồi chạy lại.",
  },
  empty: {
    label: "Không có",
    className: "bg-muted text-muted-foreground",
    hint: "Không tìm thấy kết quả nào. Thường là từ khoá chưa đúng tiếng bản địa chứ không phải địa bàn trống.",
  },
  recent: {
    label: "Vừa quét",
    className: "bg-muted text-muted-foreground",
    hint: "Bỏ qua vì chính truy vấn này đã chạy xong gần đây. Muốn quét lại thì tắt 'Bỏ qua địa bàn vừa quét' hoặc giảm số ngày khi tạo job.",
  },
  unknown: {
    label: "Không rõ",
    className: "bg-muted text-muted-foreground",
    hint: "Danh sách kết quả không hiện ra. Nên chạy lại truy vấn này.",
  },
};

/*
 * Xếp theo mức CẦN HÀNH ĐỘNG giảm dần: thứ phải xử lý đứng trước.
 */
const STOP_REASON_ORDER: JobQueryStopReason[] = [
  "cut_off",
  "cap",
  "exhausted",
  "recent",
  "empty",
  "unknown",
];

/*
 * Đếm truy vấn theo lý do dừng.
 *
 * Job quét cả nước là 34 dòng, quét tới phường/xã là 3.321 dòng — không ai dò
 * tay từng dòng để tìm địa bàn còn sót. Dòng tổng này mới là thứ dùng được:
 * nhìn một cái biết còn bao nhiêu địa bàn phải chia nhỏ.
 */
export function tallyStopReasons(
  queries: { stop_reason: JobQueryStopReason | null }[],
) {
  const counts = new Map<JobQueryStopReason, number>();
  for (const query of queries) {
    if (!query.stop_reason) continue;
    counts.set(query.stop_reason, (counts.get(query.stop_reason) ?? 0) + 1);
  }
  return STOP_REASON_ORDER.filter((reason) => counts.has(reason)).map(
    (reason) => ({
      reason,
      count: counts.get(reason) ?? 0,
      meta: STOP_REASON_META[reason],
    }),
  );
}

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
