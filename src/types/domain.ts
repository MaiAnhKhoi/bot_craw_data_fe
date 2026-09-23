/*
 * Kiểu nghiệp vụ được DÙNG CHUNG bởi nhiều feature — đặt ở đây thay vì trong
 * một feature, vì feature không được import vào ruột của feature khác.
 *
 * `JobPhase` là ví dụ duy nhất hiện tại: module Jobs mô tả pha của một job, còn
 * module Stats báo pha mà worker đang chạy (`WorkerStatus.current_phase`).
 */
/*
 * `sweep` KHÔNG thuộc về một job nào: đó là lúc worker rảnh và quay sang xử lý
 * những địa điểm người dùng bấm "Kiểm tra lại". Thiếu nó ở đây thì huy hiệu
 * worker tra bảng nhãn ra `undefined` và hiện ra ô trống.
 */
export type JobPhase = "search" | "detail" | "enrich" | "sweep" | "idle";

/** Nhãn tiếng Việt của từng pha — dùng ở huy hiệu worker và màn chi tiết job. */
export const JOB_PHASE_LABEL: Record<JobPhase, string> = {
  search: "Đang tìm kiếm",
  detail: "Đang lấy chi tiết",
  enrich: "Đang kiểm tra website",
  sweep: "Đang kiểm tra lại",
  idle: "Đang rảnh",
};
