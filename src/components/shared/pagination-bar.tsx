"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/format";

/*
 * Thanh phân trang cho danh sách PHÂN TRANG Ở SERVER.
 * Nhận đúng những con số backend trả về (`page`, `size`, `total`, `pages`) —
 * không tự suy ra từ số dòng của trang hiện tại, vì trang cuối lẻ dòng sẽ làm
 * lệch cả vị trí bắt đầu.
 */
export function PaginationBar({
  page,
  size,
  total,
  pages,
  onPageChange,
  disabled = false,
}: {
  /** 1-based, đúng như contract. */
  page: number;
  size: number;
  total: number;
  pages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const start = total === 0 ? 0 : (page - 1) * size + 1;
  const end = Math.min(page * size, total);
  const pageCount = Math.max(pages, 1);

  /*
   * Chỉ giữ bản nháp trong lúc người dùng đang gõ dở; ngoài ra ô nhập đọc
   * thẳng từ `page`. Nhờ vậy nó tự bám theo trang hiện tại mỗi khi trang đổi
   * từ bên ngoài (bấm mũi tên, đổi bộ lọc) mà không phải setState trong effect.
   */
  const [draft, setDraft] = useState<string | null>(null);

  function handleJump(event: FormEvent<HTMLFormElement>) {
    // Không chặn thì Enter sẽ nạp lại cả trang theo kiểu form HTML thuần.
    event.preventDefault();
    // Dù nhảy được hay không, ô nhập cũng phải trả về đúng trang đang đứng.
    setDraft(null);
    if (disabled) return;

    /*
     * Để trống, gõ chữ, số âm hay 99999 đều phải dừng lại ở đây: mỗi lần gọi
     * `onPageChange` với con số vô lý là một truy vấn OFFSET tốn công trên
     * bảng hàng chục nghìn dòng mà người dùng chẳng nhận được gì.
     */
    const raw = (draft ?? "").trim();
    const parsed = Number(raw);
    if (raw === "" || !Number.isFinite(parsed)) return;

    const target = Math.min(Math.max(Math.trunc(parsed), 1), pageCount);
    // Nhảy đúng chỗ đang đứng thì im lặng, đừng bắt tải lại một lượt thừa.
    if (target !== page) onPageChange(target);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Esc là đường lùi quen tay khi lỡ gõ sai, khỏi phải xoá từng ký tự.
    if (event.key === "Escape") setDraft(null);
  }

  return (
    <div className="flex flex-col gap-2 border-t px-3 py-2.5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        Hiển thị {formatNumber(start)}–{formatNumber(end)} trong{" "}
        {formatNumber(total)} dòng
      </span>
      <div className="flex items-center gap-2">
        <span className="tabular-nums">
          Trang {formatNumber(page)}/{formatNumber(pageCount)}
        </span>
        {pageCount > 1 ? (
          // Chỉ một trang thì ô nhập là nhiễu thuần tuý, không có chỗ nào để nhảy.
          <form onSubmit={handleJump} className="flex items-center">
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className="h-7 w-16 text-center tabular-nums"
              aria-label={`Đi tới trang, từ 1 đến ${pageCount}`}
              value={draft ?? String(page)}
              disabled={disabled}
              onChange={(event) => setDraft(event.target.value)}
              // Rời ô là bỏ bản nháp, để số hiển thị luôn khớp trang thật.
              onBlur={() => setDraft(null)}
              onKeyDown={handleKeyDown}
            />
            {/*
             * Form một ô vẫn submit được bằng Enter, nhưng người dùng bàn phím
             * và trình đọc màn hình cần một đích bấm rõ ràng.
             */}
            <button type="submit" className="sr-only">
              Đi tới trang
            </button>
          </form>
        ) : null}
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Trang trước"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Trang sau"
          disabled={disabled || page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
