/*
 * Kiểu nghiệp vụ được DÙNG CHUNG bởi nhiều feature — đặt ở đây thay vì trong
 * một feature, vì feature không được import vào ruột của feature khác.
 *
 * `JobPhase` là ví dụ duy nhất hiện tại: module Jobs mô tả pha của một job, còn
 * module Stats báo pha mà worker đang chạy (`WorkerStatus.current_phase`).
 */
export type JobPhase = "search" | "detail" | "enrich" | "idle";

/** Nhãn tiếng Việt của từng pha — dùng ở huy hiệu worker và màn chi tiết job. */
export const JOB_PHASE_LABEL: Record<JobPhase, string> = {
  search: "Đang tìm kiếm",
  detail: "Đang lấy chi tiết",
  enrich: "Đang kiểm tra website",
  idle: "Đang rảnh",
};
