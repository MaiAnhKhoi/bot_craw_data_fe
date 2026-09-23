import { normalizeKeywords } from "@/features/keyword/lib/keyword-map";
import type { KeywordSet } from "@/features/keyword/types";

/*
 * Phép tính THUẦN của "Bộ từ khoá đã lưu" (không React, không API).
 *
 * Mọi thứ ở đây xoay quanh một sự thật của backend: bộ nhớ đệm bản dịch khoá
 * theo (bộ từ khoá gốc, quốc gia), và khoá đó BỀN với đảo thứ tự, khác
 * hoa/thường, khoảng trắng thừa — nhưng VỠ khi thiếu một từ hoặc sai một chữ.
 * Vì vậy khi cần trả lời "hai bộ này có phải một không", không được so chuỗi
 * trần: phải so đúng theo luật khoá, nếu không giao diện sẽ doạ người dùng là
 * "sắp mất bản dịch" trong khi thật ra chẳng mất gì (hoặc tệ hơn: im lặng để
 * họ ghi đè mất thật).
 */

const SPACE = String.fromCharCode(32);
const NEW_LINE = String.fromCharCode(10);

/*
 * Khoá so sánh của một bộ từ khoá — bản sao luật đệm của backend: chuẩn hoá
 * khoảng trắng, bỏ trùng, hạ hoa/thường rồi SẮP XẾP. Sắp xếp là phần quan
 * trọng nhất: "vựa trái cây" đổi chỗ với "nhà phân phối hoa quả" vẫn là cùng
 * một bộ, đừng bắt người dùng nhớ cả thứ tự.
 */
export function keywordSetKey(keywords: string[]): string {
  return normalizeKeywords(keywords)
    .map((keyword) => keyword.toLowerCase())
    .sort()
    .join(NEW_LINE);
}

/** Hai bộ có dùng chung một ô nhớ đệm bản dịch hay không. */
export function sameKeywordSet(left: string[], right: string[]): boolean {
  return keywordSetKey(left) === keywordSetKey(right);
}

/** Gộp khoảng trắng thừa trong tên, để "Trái cây  xuất khẩu" không thành tên khác. */
export function normalizeSetName(name: string): string {
  return name.trim().split(SPACE).filter(Boolean).join(SPACE);
}

/*
 * Tìm bộ trùng tên theo ĐÚNG luật của backend (không phân biệt hoa thường).
 * Cố tình KHÔNG bỏ dấu tiếng Việt: backend coi "Trái cây" và "Trai cay" là hai
 * tên khác nhau, FE mà gộp lại sẽ báo "sẽ ghi đè" cho một lần lưu thật ra tạo
 * bộ mới.
 */
export function findSetByName(
  sets: KeywordSet[],
  name: string,
): KeywordSet | undefined {
  const key = normalizeSetName(name).toLowerCase();
  if (!key) return undefined;
  return sets.find((set) => normalizeSetName(set.name).toLowerCase() === key);
}

/*
 * Nhãn trong ô chọn. Số nước đã dịch đi LIỀN với tên vì đó là thứ quyết định
 * người dùng chọn bộ nào: chọn bộ đã dịch 12 nước là 12 lượt gọi AI không phải
 * trả lại.
 */
export function keywordSetLabel(set: KeywordSet): string {
  const count = set.translated_countries.length;
  return count > 0
    ? `${set.name} (đã dịch ${count} nước)`
    : `${set.name} (chưa dịch nước nào)`;
}

/*
 * Chuỗi phụ đem ra so khi gõ tìm. Gộp cả từ khoá và mã nước vào đây để tìm
 * được theo thứ người dùng thật sự nhớ — "vựa" hay "TH" — chứ không chỉ theo
 * cái tên họ đặt vội mấy tháng trước.
 */
export function keywordSetSearchText(set: KeywordSet): string {
  return [set.name, ...set.keywords, ...set.translated_countries].join(SPACE);
}

/** Đổi bộ từ khoá thành nội dung ô textarea "mỗi dòng một từ". */
export function keywordsToText(keywords: string[]): string {
  return keywords.join(NEW_LINE);
}
