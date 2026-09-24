/*
 * Kiểu nghiệp vụ được DÙNG CHUNG bởi nhiều feature — đặt ở đây thay vì trong
 * một feature, vì feature không được import vào ruột của feature khác.
 *
 * `JobPhase`: module Jobs mô tả pha của một job, còn module Stats báo pha mà
 * worker đang chạy (`WorkerStatus.current_phase`).
 * `RelevanceSource`: cùng xuất hiện trong payload của module Địa điểm và module
 * Jobs (không hiện ra giao diện — xem chú thích của chính nó).
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

/*
 * AI phân xử hay LUẬT CỨNG quyết mức đúng ngành của một địa điểm.
 *
 * KHÔNG hiện ra giao diện ở đâu cả — bộ lọc ngành nghề là hạ tầng NGẦM, người
 * dùng chỉ gõ từ khoá rồi nhận về dữ liệu sạch. Kiểu này tồn tại vì hai module
 * cùng nhận trường đó trong payload (`Place.relevance_source` bên Địa điểm,
 * `JobReject.source` bên Jobs) và nó là đường truy vết khi chất lượng dữ liệu
 * có vấn đề.
 */
export type RelevanceSource = "rule" | "ai";

/*
 * Vai trò của tài khoản đăng nhập (docs/API_CONTRACT.md §1).
 *
 * Chỉ hai mức, vì công cụ chỉ cần trả lời đúng một câu hỏi: người này được ĐẶT
 * LỆNH QUÉT hay chỉ được ĐỌC DỮ LIỆU. Cả hệ thống có một worker chạy tuần tự
 * trên một IP văn phòng — một job đặt sai (trót chọn 40 nước) chiếm worker cả
 * ngày và đẩy rủi ro Google chặn IP lên, mà bị chặn là cả công ty mất dùng.
 *
 * Sống ở đây chứ không trong features/auth vì features/users cũng cần đúng kiểu
 * này, mà feature không được import vào ruột của feature khác.
 */
export type UserRole = "admin" | "sale";

/*
 * Nhãn + màu huy hiệu của vai trò. Cùng lý do với `JOB_PHASE_LABEL`: backend
 * chỉ trả mã, toàn bộ câu chữ tiếng Việt gom về một chỗ.
 *
 * Admin mang màu hổ phách — sắc "cảnh báo nhẹ" đang dùng cho job tạm dừng —
 * chứ không phải màu tích cực: đây là vai trò đặt được lệnh tốn worker và tốn
 * tiền AI, nhìn lướt bảng phải đếm ngay được có bao nhiêu người đang cầm nó.
 */
export const USER_ROLE_META: Record<
  UserRole,
  { label: string; badgeClass: string; hint: string }
> = {
  admin: {
    label: "Quản trị",
    badgeClass:
      "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
    hint: "Đặt được lệnh quét, chia nhỏ địa bàn và quản lý tài khoản.",
  },
  sale: {
    label: "Sale",
    badgeClass: "bg-muted text-muted-foreground",
    hint: "Xem, lọc và xuất dữ liệu, chăm sóc lead. Không đặt được lệnh quét.",
  },
};

/** Thứ tự trong ô chọn vai trò — khai rõ thay vì trông chờ vào thứ tự khoá. */
export const USER_ROLE_ORDER: UserRole[] = ["admin", "sale"];

/*
 * Tra nhãn vai trò AN TOÀN, dùng cho mọi chỗ đọc vai trò từ payload của server.
 *
 * Kiểu nói rằng `role` luôn có, nhưng đó là lời hứa của hợp đồng API chứ không
 * phải sự thật lúc chạy: một backend chưa kịp lên bản mới sẽ trả hồ sơ KHÔNG có
 * trường này, và khi đó `USER_ROLE_META[undefined].label` ném lỗi ngay giữa
 * header — tức là trắng cả app chỉ vì thiếu một cái huy hiệu. Trả `null` để nơi
 * gọi tự bỏ qua phần hiển thị đó.
 */
export function userRoleMeta(role: UserRole | null | undefined) {
  if (!role) return null;
  return USER_ROLE_META[role] ?? null;
}
