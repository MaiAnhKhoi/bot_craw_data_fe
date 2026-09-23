import { splitLines } from "@/lib/format";

/*
 * Gộp các dòng địa điểm do bộ chọn địa giới sinh ra vào ô textarea của form.
 *
 * Ô textarea là NGUỒN SỰ THẬT DUY NHẤT gửi lên API, nên bộ chọn không giữ danh
 * sách riêng — nó chỉ ghi thêm vào đây. Hai điều bắt buộc giữ đúng:
 *  - KHÔNG đụng các dòng người dùng đã tự gõ (chỉ nối thêm vào cuối);
 *  - bỏ trùng, vì thêm hai lần cùng một tỉnh sẽ nhân đôi số truy vấn mà không
 *    thu thêm được địa điểm nào.
 *
 * Dòng trống bị loại giống hệt cách `toJobCreate` xử lý lúc gửi đi, nên không
 * có dữ liệu nào của người dùng bị mất.
 */

const NEWLINE = String.fromCharCode(10);

export function mergeLocationLines(
  existing: string,
  incoming: string[],
): { text: string; added: number } {
  const current = splitLines(existing);
  const seen = new Set(current);
  const added: string[] = [];

  for (const line of incoming) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || seen.has(trimmed)) continue;
    seen.add(trimmed);
    added.push(trimmed);
  }

  return { text: [...current, ...added].join(NEWLINE), added: added.length };
}
