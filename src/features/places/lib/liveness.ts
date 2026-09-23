import type {
  BusinessStatus,
  LivenessLabel,
  WebsiteStatus,
} from "@/features/places/types/place";

/*
 * Bảng dịch của module Địa điểm.
 *
 * Backend chỉ trả MÃ (`CLOSED_PERMANENTLY`, `REVIEWS_STALE_3Y`...) — cố tình
 * như vậy để đổi câu chữ tiếng Việt không phải đụng backend. Toàn bộ việc dịch
 * và chọn màu nằm gọn ở file này; component chỉ gọi hàm, không tự map chuỗi.
 *
 * Gặp mã LẠ (backend thêm lý do mới mà FE chưa cập nhật) thì hiện nguyên mã
 * thay vì bỏ trống — người dùng vẫn biết có lý do, và lỗi lộ ra để sửa.
 */

const LIVENESS_REASON_LABEL: Record<string, string> = {
  CLOSED_PERMANENTLY: "Google ghi nhận đã đóng cửa vĩnh viễn",
  CLOSED_TEMPORARILY: "Google ghi nhận đang tạm đóng cửa",
  NO_PHONE: "Không có số điện thoại",
  INVALID_PHONE: "Số điện thoại không hợp lệ",
  NO_WEBSITE: "Không có website",
  WEBSITE_DEAD: "Website không truy cập được",
  WEBSITE_PARKED: "Website chỉ là trang đỗ tên miền",
  NO_REVIEWS: "Chưa có đánh giá nào",
  FEW_REVIEWS: "Rất ít đánh giá",
  REVIEWS_STALE_1Y: "Không có đánh giá mới trong 1 năm",
  REVIEWS_STALE_2Y: "Không có đánh giá mới trong 2 năm",
  REVIEWS_STALE_3Y: "Không có đánh giá mới trong 3 năm",
  NO_HOURS: "Không có giờ mở cửa",
};

export function livenessReasonLabel(code: string): string {
  return LIVENESS_REASON_LABEL[code] ?? code;
}

export function livenessReasonLabels(codes: string[]): string[] {
  return codes.map(livenessReasonLabel);
}

/*
 * Màu huy hiệu tình trạng: ACTIVE xanh lá · SUSPECT hổ phách · DEAD đỏ.
 * Dùng lớp Tailwind có biến thể dark đi kèm để nền tối vẫn đọc được.
 */
export const LIVENESS_META: Record<
  LivenessLabel,
  { label: string; badgeClass: string; dotClass: string }
> = {
  ACTIVE: {
    label: "Còn hoạt động",
    badgeClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
    dotClass: "bg-emerald-500",
  },
  SUSPECT: {
    label: "Nghi ngờ",
    badgeClass:
      "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
    dotClass: "bg-amber-500",
  },
  DEAD: {
    label: "Đã chết",
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
    dotClass: "bg-red-500",
  },
};

/** Thứ tự cố định cho ô lọc nhiều lựa chọn và biểu đồ tròn. */
export const LIVENESS_ORDER: LivenessLabel[] = ["ACTIVE", "SUSPECT", "DEAD"];

/** Màu biểu đồ tròn liveness — cùng hệ màu với huy hiệu để đọc một mạch. */
export const LIVENESS_CHART_COLOR: Record<LivenessLabel, string> = {
  ACTIVE: "oklch(0.696 0.17 162.48)",
  SUSPECT: "oklch(0.769 0.155 70.08)",
  DEAD: "oklch(0.637 0.208 25.33)",
};

export const BUSINESS_STATUS_LABEL: Record<BusinessStatus, string> = {
  OPERATIONAL: "Đang hoạt động",
  CLOSED_TEMPORARILY: "Tạm đóng cửa",
  CLOSED_PERMANENTLY: "Đóng cửa vĩnh viễn",
};

export const WEBSITE_STATUS_META: Record<
  WebsiteStatus,
  { label: string; badgeClass: string }
> = {
  OK: {
    label: "Sống",
    badgeClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  DEAD: {
    label: "Chết",
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  },
  PARKED: {
    label: "Trang đỗ",
    badgeClass:
      "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
  },
  UNCHECKED: {
    label: "Chưa kiểm tra",
    badgeClass: "bg-muted text-muted-foreground",
  },
  NONE: {
    label: "Không có",
    badgeClass: "bg-muted text-muted-foreground",
  },
};
