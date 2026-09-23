import { ROUTES } from "@/lib/constants";
import { STOP_REASON_META } from "@/features/jobs/lib/job-status";
import type { RemainingStopReason } from "@/features/remaining-areas/types/remaining-area";

/*
 * Đường dẫn của trang này khai ngay cạnh feature sở hữu nó, thay vì thêm vào
 * bảng ROUTES dùng chung: chỉ hai nơi cần tới nó (mục menu và chính trang này),
 * và cả hai đều đã import từ module này.
 */
export const REMAINING_AREAS_ROUTE = "/remaining-areas";

/*
 * Giá trị của ô lọc khi không lọc gì. Phải là một chuỗi THẬT chứ không phải
 * chuỗi rỗng: Select coi chuỗi rỗng là "chưa chọn gì" và quay về hiện
 * placeholder, tức là ô lọc trông như đang hỏng.
 */
export const ALL_STOP_REASONS = "all";

/*
 * Đúng ba lý do backend trả về cho trang này (docs/API_CONTRACT.md §2).
 * Nhãn và màu DÙNG LẠI `STOP_REASON_META` của module Jobs — bảng nhãn thứ hai
 * là cách chắc chắn nhất để cùng một mã hiện hai chữ khác nhau ở hai màn.
 */
export const REMAINING_STOP_REASONS: RemainingStopReason[] = [
  "cut_off",
  "cap",
  "unknown",
];

export const STOP_REASON_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: ALL_STOP_REASONS, label: "Tất cả lý do" },
  ...REMAINING_STOP_REASONS.map((reason) => ({
    value: reason,
    label: STOP_REASON_META[reason].label,
  })),
];

/*
 * Đường dẫn sang màn Địa điểm đã lọc sẵn theo đúng lượt tìm này.
 *
 * `keyword` chính là CẢ CHUỖI TRUY VẤN — backend lưu nguyên chuỗi đó trong
 * `place_keywords` — nên một tham số là đủ tách chính xác. Bắt buộc
 * `encodeURIComponent`: truy vấn có dấu phẩy và khoảng trắng ("vựa trái cây
 * Đồng Tháp, Việt Nam"), để trần là hỏng query string.
 */
export function placesHrefForQuery(jobId: number, query: string): string {
  return `${ROUTES.places}?job_id=${jobId}&keyword=${encodeURIComponent(query)}`;
}
