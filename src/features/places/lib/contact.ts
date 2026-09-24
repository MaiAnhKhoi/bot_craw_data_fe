import type { ContactStatus } from "@/features/places/types/place";

/*
 * Bảng nhãn + màu của TRẠNG THÁI CHĂM SÓC.
 *
 * Tách khỏi `liveness.ts` vì hai thứ trả lời hai câu hỏi khác hẳn nhau và người
 * dùng phải phân biệt được ngay: `liveness_label` nói doanh nghiệp đó CÒN SỐNG
 * không (máy chấm), còn `contact_status` nói BÊN MÌNH đã đụng tới nó chưa
 * (người ghi). Một lead hoàn toàn có thể vừa "Còn hoạt động" vừa "Loại".
 *
 * Giống `LIVENESS_META` và `JOB_STATUS_META`: đây là chỗ DUY NHẤT có câu chữ
 * tiếng Việt và lớp màu, để đổi nhãn không phải mở từng component.
 */

export interface ContactStatusMeta {
  label: string;
  /** Lớp nền/chữ cho huy hiệu — luôn kèm biến thể dark. */
  badgeClass: string;
  /** Chấm tròn đứng trước nhãn, dùng cả trong menu chọn. */
  dotClass: string;
}

/*
 * Chọn màu theo mức độ "cần để mắt tới", KHÔNG theo mức tốt/xấu:
 *
 *  - new      : phần lớn bảng là dòng này. Tô đậm cả 15-30k dòng thì màu mất hết
 *               ý nghĩa, nên nó là ô RỖNG viền nhạt — thứ duy nhất nổi lên trong
 *               bảng sẽ là những dòng đã được đụng tới.
 *  - called   : lam (sky) — cùng hệ với `done` của job, nghĩa "đã làm xong việc".
 *  - interested: lục (emerald) — trùng hệ với ACTIVE bên liveness, và đây đúng là
 *               thứ người dùng quét mắt tìm.
 *  - rejected : xám + gạch ngang, mượn nguyên cách của `cancelled` bên Jobs. CỐ Ý
 *               không dùng đỏ: đỏ trong bảng này đang là "đã chết" của liveness,
 *               thêm một sắc đỏ thứ hai ngay cột bên cạnh là mời người ta đọc
 *               nhầm "mình loại" thành "nó đóng cửa".
 *
 * Xám của `rejected` và ô rỗng của `new` phân biệt bằng NỀN (đặc/rỗng) và nét
 * gạch ngang, không phải bằng sắc độ — nhìn lướt vẫn tách được.
 */
export const CONTACT_STATUS_META: Record<ContactStatus, ContactStatusMeta> = {
  new: {
    label: "Chưa liên hệ",
    badgeClass: "border-border bg-transparent text-muted-foreground",
    dotClass: "bg-transparent ring-1 ring-muted-foreground/60",
  },
  called: {
    label: "Đã gọi",
    badgeClass: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
    dotClass: "bg-sky-500",
  },
  interested: {
    label: "Quan tâm",
    badgeClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
    dotClass: "bg-emerald-500",
  },
  rejected: {
    label: "Loại",
    badgeClass: "bg-muted text-muted-foreground line-through",
    dotClass: "bg-muted-foreground/40",
  },
};

/*
 * Thứ tự cố định trong menu và ô lọc — theo đúng đường đi của một lead:
 * chưa liên hệ -> đã gọi -> quan tâm, còn "Loại" là ngõ cụt nên đứng cuối.
 */
export const CONTACT_STATUS_ORDER: ContactStatus[] = [
  "new",
  "called",
  "interested",
  "rejected",
];

/*
 * Tra nhãn/màu, chịu được mã LẠ. Backend thêm trạng thái mới mà FE chưa cập nhật
 * thì hiện nguyên mã thay vì bỏ trống hoặc vỡ — cùng cách xử lý với
 * `livenessReasonLabel`: người dùng vẫn biết dòng này có trạng thái, còn lỗi thì
 * lộ ra để sửa.
 */
export function contactStatusMeta(status: string): ContactStatusMeta {
  return (
    CONTACT_STATUS_META[status as ContactStatus] ?? {
      label: status,
      badgeClass: "bg-muted text-muted-foreground",
      dotClass: "bg-muted-foreground/40",
    }
  );
}
