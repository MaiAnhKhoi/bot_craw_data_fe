import type { KeywordSource } from "@/features/keyword/types";

/*
 * Bảng dịch nguồn gốc bộ từ khoá.
 *
 * Backend chỉ trả MÃ (`ai`, `cache`, `user`, `original`, `fallback`) — câu chữ
 * tiếng Việt và màu sắc nằm gọn ở đây, đổi chữ không phải đụng backend.
 *
 * `fallback` dùng màu hổ phách chung với hộp cảnh báo: nó KHÔNG phải trạng thái
 * bình thường mà là "chưa dịch được, đang tạm dùng từ khoá tiếng Việt" — quét
 * nước ngoài bằng từ khoá tiếng Việt gần như không ra gì, người dùng cần thấy
 * ngay chỗ nào đang ở tình trạng đó.
 */

const SOURCE_LABEL: Record<KeywordSource, string> = {
  ai: "AI vừa sinh",
  cache: "Đã lưu",
  user: "Bạn đã sửa",
  original: "Từ khoá gốc",
  fallback: "Chưa dịch được",
};

const SOURCE_CLASS: Record<KeywordSource, string> = {
  ai: "bg-primary text-primary-foreground",
  cache: "bg-secondary text-secondary-foreground",
  user: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300",
  original: "border-border bg-transparent text-muted-foreground",
  fallback: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
};

/** Gặp mã lạ thì hiện nguyên mã — người dùng vẫn biết có chuyện, lỗi lộ ra để sửa. */
export function keywordSourceLabel(source: KeywordSource): string {
  return SOURCE_LABEL[source] ?? source;
}

export function keywordSourceClass(source: KeywordSource): string {
  return SOURCE_CLASS[source] ?? SOURCE_CLASS.original;
}
