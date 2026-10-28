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
 *
 * KHUNG CUỘN KIỂU EXCEL. Bảng nằm trong MỘT khung có chiều cao giới hạn, cuộn cả
 * hai chiều. Trước đây khung chỉ giới hạn chiều cao khi ảo hoá (> 100 dòng), còn
 * thanh cuộn ngang thì nằm ở ĐÁY TOÀN BỘ bảng — kéo tới dòng 50 là cách thanh
 * cuộn cả một màn hình, không với tới được cột "Hành động" ở mép phải. Giờ khung
 * luôn có chiều cao hữu hạn nên thanh cuộn ngang luôn nằm ở mép dưới khung, và
 * ba thứ được ghim (`position: sticky`) giống "Freeze Panes":
 *   - hàng tiêu đề (luôn biết đang nhìn cột nào),
 *   - cột "Tên công ty" bên trái (luôn biết đang nhìn dòng nào),
 *   - cột "Hành động" bên phải (luôn bấm được nút của dòng đang nhìn).
 * Bảng này chỉ dựng từ 768px trở lên; điện thoại dùng danh sách thẻ
 * (`places-cards.tsx`) vì một bảng 11 cột không dùng được ở 375px.
 */

const ROW_HEIGHT = 53;

/*
 * Chiều cao tối đa của khung: gần hết khung nhìn trừ phần phía trên (tiêu đề
 * trang, bộ lọc, thanh đếm) và thanh phân trang phía dưới, để thanh cuộn ngang
 * nằm TRONG màn hình ngay khi mới vào trang chứ không phải cuộn trang mới thấy.
 * `max()` chặn đáy để màn thấp quá thì vẫn còn vài dòng đọc được.
 */
const KHUNG_CUON = "max-h-[max(22rem,calc(100dvh-23rem))]";

/*
 * Lớp ghim theo id cột. Ô ghim PHẢI có nền đặc, nếu không các cột cuộn qua bên
 * dưới sẽ lộ xuyên qua chữ. `bg-card` là nền của Card chứa bảng. Khi rê chuột,
 * dòng được tô `muted/50` — ô ghim đặc nên không tự ăn theo, phải tô lại đúng
 * màu pha đó (qua `group/row` của TableRow).
 *
 * Đường kẻ phân cách vẽ bằng `inset box-shadow` chứ không dùng `border`: bảng
 * ở chế độ `border-collapse`, viền của ô sticky không trôi theo ô mà ở lại chỗ cũ.
 *
 * Cột TÊN chỉ ghim khi KHUNG BẢNG đủ rộng (`@4xl` = 56rem, theo bề rộng của chính
 * khung chứ không theo màn hình, vì thanh bên trái ăn mất ~240px ở màn lớn). Ghim
 * cả cột tên (~256px) lẫn cột hành động (~175px) vào khung 720px là đóng băng
 * 60% bề ngang, phần còn lại chỉ đủ nhìn một cột mỗi lần cuộn. Cột HÀNH ĐỘNG thì
 * luôn ghim: đó là thứ người dùng không với tới được trong bản cũ.
 */
const NEN_GHIM =
  "bg-card group-hover/row:bg-[color-mix(in_oklab,var(--muted)_50%,var(--card))]";
const NEN_GHIM_TEN =
  "@4xl:bg-card @4xl:group-hover/row:bg-[color-mix(in_oklab,var(--muted)_50%,var(--card))]";

const GHIM_DAU: Record<string, string> = {
  name: "@4xl:left-0 @4xl:z-30 @4xl:shadow-[inset_0_-1px_0_var(--border),inset_-1px_0_0_var(--border)]",
  actions:
    "right-0 z-30 shadow-[inset_0_-1px_0_var(--border),inset_1px_0_0_var(--border)]",
};

const GHIM_THAN: Record<string, string> = {
  name: `@4xl:sticky @4xl:left-0 @4xl:z-10 @4xl:shadow-[inset_-1px_0_0_var(--border)] ${NEN_GHIM_TEN}`,
  actions: `sticky right-0 z-10 shadow-[inset_1px_0_0_var(--border)] ${NEN_GHIM}`,
};

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
    /*
     * `tabIndex={0}` để người dùng bàn phím cuộn được khung bằng mũi tên: một
     * vùng cuộn không có phần tử focus được bên trong thì bàn phím không vào nổi.
     */
    <div
      ref={scrollRef}
      role="region"
      aria-label="Bảng địa điểm"
      tabIndex={0}
      className={cn(KHUNG_CUON, "@container overflow-auto outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset")}
    >
      <Table containerClassName="overflow-visible">
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
                    className={cn(
                      "sticky top-0 z-20 bg-card shadow-[inset_0_-1px_0_var(--border)] first:pl-4 last:pr-4 last:text-right",
                      GHIM_DAU[header.column.id],
                    )}
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
            <TableRow
              key={row.id}
              style={{ height: ROW_HEIGHT }}
              className="group/row"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn(
                    "first:pl-4 last:pr-4 last:text-right",
                    GHIM_THAN[cell.column.id],
                  )}
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
