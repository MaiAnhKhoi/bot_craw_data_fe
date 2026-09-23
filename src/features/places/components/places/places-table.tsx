"use client";

import { useRef } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VIRTUAL_ROW_THRESHOLD } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  SORTABLE_COLUMN_IDS,
  placeColumns,
} from "@/features/places/components/places/place-columns";
import type { Place, PlaceSort } from "@/features/places/types/place";

/*
 * Bảng Địa điểm — TanStack Table v8, MỌI thứ nặng đều ở server.
 *
 * - `manualPagination` + `manualSorting`: bảng chỉ vẽ đúng trang server gửi
 *   xuống, không bao giờ tải hết rồi lọc/sắp ở client (Rule 1).
 * - Khi một trang vượt VIRTUAL_ROW_THRESHOLD dòng thì bật ảo hoá bằng
 *   @tanstack/react-virtual: chỉ dựng DOM cho những dòng đang nhìn thấy, phần
 *   còn lại thay bằng hai ô đệm trên/dưới. Cách đệm này giữ nguyên thẻ <table>
 *   thật nên các cột vẫn tự canh đều — khác với kiểu tuyệt đối hoá từng dòng,
 *   vốn phá vỡ căn cột và buộc phải khai chiều rộng cứng cho mọi cột.
 * - Dưới ngưỡng đó thì render thẳng: ảo hoá 50 dòng chỉ tốn thêm phép tính.
 */

const ROW_HEIGHT = 53;

export function PlacesTable({
  places,
  columnVisibility,
  sort,
  onSortChange,
}: {
  places: Place[];
  columnVisibility: VisibilityState;
  sort: PlaceSort;
  onSortChange: (sort: PlaceSort) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data: places,
    columns: placeColumns,
    state: { columnVisibility },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const rows = table.getRowModel().rows;
  const virtualize = rows.length > VIRTUAL_ROW_THRESHOLD;
  /* colSpan của ô đệm phải theo số cột ĐANG HIỆN, không theo tổng số cột. */
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  const virtualItems = virtualize ? virtualizer.getVirtualItems() : [];
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
      : 0;
  const visibleRows = virtualize
    ? virtualItems.map((item) => rows[item.index])
    : rows;

  /*
   * Bấm lần 1 sắp tăng dần, lần 2 đảo chiều (tiền tố "-"), lần 3 quay lại tăng.
   * Toàn bộ việc sắp xếp do backend làm — ở đây chỉ đổi tham số.
   */
  const toggleSort = (columnId: string) => {
    const descending: PlaceSort = `-${columnId}` as PlaceSort;
    const ascending = columnId as PlaceSort;
    onSortChange(sort === ascending ? descending : ascending);
  };

  return (
    <div
      ref={scrollRef}
      className={cn(virtualize && "max-h-[70vh] overflow-y-auto")}
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortable = SORTABLE_COLUMN_IDS.has(header.column.id);
                const active =
                  sort === header.column.id || sort === `-${header.column.id}`;
                const descending = sort === `-${header.column.id}`;

                return (
                  <TableHead
                    key={header.id}
                    className="first:pl-4 last:pr-4 last:text-right"
                  >
                    {header.isPlaceholder ? null : sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(header.column.id)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md transition-colors hover:text-foreground",
                          active ? "text-foreground" : "text-muted-foreground",
                        )}
                        aria-label={`Sắp xếp theo ${String(header.column.columnDef.header)}`}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {!active ? (
                          <ArrowUpDownIcon className="size-3.5 opacity-60" />
                        ) : descending ? (
                          <ArrowDownIcon className="size-3.5" />
                        ) : (
                          <ArrowUpIcon className="size-3.5" />
                        )}
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {paddingTop > 0 ? (
            <tr aria-hidden="true">
              <td style={{ height: paddingTop }} colSpan={visibleColumnCount} />
            </tr>
          ) : null}

          {visibleRows.map((row) => (
            <TableRow key={row.id} style={{ height: ROW_HEIGHT }}>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className="first:pl-4 last:pr-4 last:text-right"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}

          {paddingBottom > 0 ? (
            <tr aria-hidden="true">
              <td
                style={{ height: paddingBottom }}
                colSpan={visibleColumnCount}
              />
            </tr>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
