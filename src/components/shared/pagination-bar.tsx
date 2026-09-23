"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
