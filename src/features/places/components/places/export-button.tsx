"use client";

import { useMemo, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { placesExportUrl } from "@/features/places/api/places-api";
import {
  EXPORT_COLUMN_COUNT,
  exportColumnsDropped,
  exportColumnsForVisibility,
} from "@/features/places/lib/export-columns";
import { useAuthStore } from "@/stores/auth-store";
import type { ExportFormat, PlaceFilters } from "@/features/places/types/place";

/*
 * Nút xuất Excel/CSV/JSON.
 *
 * CỐ Ý không fetch blob rồi tạo object URL: file có thể tới 100.000 dòng, kéo
 * hết vào RAM là cách chắc chắn nhất làm treo tab. Ở đây ta tạo thẻ <a download>
 * rồi bấm nó — trình duyệt tải bằng cơ chế tải file bình thường, có thanh tiến
 * độ, tạm dừng, và không giữ gì trong bộ nhớ của trang.
 *
 * Bộ lọc truyền vào là ĐÚNG bộ lọc bảng đang dùng, nên file tải về luôn khớp
 * với thứ người dùng đang nhìn. PHẠM VI CỘT thì không mặc nhiên như vậy — xem
 * ghi chú ở `chiCotDangHien` bên dưới.
 */
const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "xlsx", label: "Excel (.xlsx)" },
  { value: "csv", label: "CSV (.csv)" },
  { value: "json", label: "JSON (.json)" },
];

export function ExportButton({
  filters,
  columnVisibility,
  disabled,
}: {
  filters: PlaceFilters;
  /** State ẩn/hiện cột của bảng — cùng một nguồn với menu "Cột". */
  columnVisibility: VisibilityState;
  disabled?: boolean;
}) {
  const token = useAuthStore((state) => state.token);

  /*
   * MẶC ĐỊNH TẮT, và cố ý KHÔNG nhớ vào localStorage như lựa chọn ẩn/hiện cột.
   *
   * Bớt cột là hành vi LÀM MẤT DỮ LIỆU: ẩn một cột trên bảng thì bấm một cái là
   * hiện lại, còn file đã gửi cho sale thì không lấy lại được — họ mở ra mới
   * biết thiếu, và thường là biết muộn. Nhớ lựa chọn này qua các phiên nghĩa là
   * ba tháng sau có người xuất file thiếu cột mà không hiểu vì sao. Vì vậy:
   * muốn file gọn thì phải chủ động bật, ngay trước khi tải.
   */
  const [chiCotDangHien, setChiCotDangHien] = useState(false);

  /*
   * Khoá cột gửi lên server — KHÔNG phải id cột của bảng. Bảng và file là hai
   * tập cột khác nhau, bảng ánh xạ nằm ở features/places/lib/export-columns.ts.
   */
  const khoaDangHien = useMemo(
    () => exportColumnsForVisibility(columnVisibility),
    [columnVisibility],
  );

  /*
   * Ca người dùng tắt HẾT cột bảng: không còn khoá nào để gửi, mà gửi rỗng thì
   * theo hợp đồng API server lại xuất đủ 23 cột. Không được im lặng để người
   * dùng tưởng đã lọc — nhãn dưới mỗi định dạng nói thẳng ra điều đó.
   */
  const locDuocCot = chiCotDangHien && khoaDangHien.length > 0;

  /* Tên những cột SẼ MẤT. Con số nói mất bao nhiêu, tên mới nói mất cái gì. */
  const cotBiBo = useMemo(
    () => exportColumnsDropped(khoaDangHien),
    [khoaDangHien],
  );

  const download = (format: ExportFormat) => {
    if (!token) return;
    /*
     * JSON KHÔNG bao giờ kèm `columns`: json là để MÁY đọc, thiếu trường là bên
     * tiêu thụ hỏng ngay, nên server luôn xuất đủ trường cho định dạng này. Gửi
     * một tham số server bỏ qua chỉ làm người đọc log tưởng nó có tác dụng.
     */
    const columns =
      locDuocCot && format !== "json" ? khoaDangHien.slice() : undefined;
    const link = document.createElement("a");
    link.href = placesExportUrl(filters, format, token, columns);
    link.download = "";
    link.rel = "noreferrer noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  /*
   * Câu mô tả nằm ngay DƯỚI từng định dạng chứ không gom thành một dòng chung:
   * người dùng phải thấy mình sắp bỏ bao nhiêu cột ngay tại chỗ sắp bấm, không
   * phải tự nhớ một con số đọc lướt ở phía trên.
   */
  const moTaCot = (format: ExportFormat): string => {
    if (!chiCotDangHien) return `Đủ ${EXPORT_COLUMN_COUNT} cột`;
    if (khoaDangHien.length === 0) {
      return `Bảng không còn cột nào đang hiện — vẫn ra đủ ${EXPORT_COLUMN_COUNT} cột`;
    }
    if (format === "json") {
      return `Vẫn đủ ${EXPORT_COLUMN_COUNT} trường — JSON không bỏ trường nào`;
    }
    return `Xuất ${khoaDangHien.length}/${EXPORT_COLUMN_COUNT} cột`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" disabled={disabled} />}
      >
        <DownloadIcon />
        Xuất file
      </DropdownMenuTrigger>
      {/*
        * Rộng hơn menu cũ (w-44) vì mỗi mục giờ có thêm một dòng giải thích.
        * `max-w-` chặn trần theo bề ngang màn hình: menu neo vào nút nằm sát mép
        * phải, ở 375px mà không chặn thì nó tràn ra ngoài rồi sinh thêm một
        * thanh cuộn ngang thứ hai bên cạnh vùng cuộn của bảng.
        */}
      <DropdownMenuContent
        align="end"
        className="w-72 max-w-[calc(100vw-1.5rem)]"
      >
        {/*
          * Phạm vi cột đứng TRƯỚC danh sách định dạng: bấm một định dạng là tải
          * ngay và menu đóng lại, nên thứ ảnh hưởng tới nội dung file phải gặp
          * trước, không phải nằm dưới đáy chờ người ta cuộn xuống.
          *
          * DropdownMenuLabel là <Menu.GroupLabel> của Base UI, nó ĐỌC context
          * của <Menu.Group>. Đặt ngoài Group thì component ném lỗi ngay lúc mở
          * menu và kéo sập cả trang (Base UI error #31) — vì vậy mỗi nhãn phải
          * nằm trong một DropdownMenuGroup.
          */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Phạm vi cột</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/*
            * CheckboxItem của Base UI mặc định `closeOnClick: false` nên menu ở
            * lại sau khi bấm — đúng ý: bật xong người dùng còn phải chọn định
            * dạng, đóng menu ở đây là bắt họ mở lại từ đầu.
            */}
          <DropdownMenuCheckboxItem
            checked={chiCotDangHien}
            onCheckedChange={setChiCotDangHien}
            title={
              cotBiBo.length > 0
                ? `Sẽ bỏ ${cotBiBo.length} cột: ${cotBiBo.join(", ")}`
                : "Mọi cột của file đều có mặt trên bảng"
            }
          >
            Chỉ xuất các cột đang hiện
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel>Định dạng</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {FORMATS.map((format) => (
            /*
             * Hai dòng nên mục menu phải đổi trục. `label` là BẮT BUỘC khi
             * children không còn là chữ trơn: Base UI lấy nó cho việc gõ-để-nhảy
             * trong menu, thiếu thì gõ "e" không nhảy tới Excel được nữa.
             */
            <DropdownMenuItem
              key={format.value}
              label={format.label}
              className="flex-col items-start gap-0"
              onClick={() => download(format.value)}
            >
              <span>{format.label}</span>
              {/*
                * Với JSON đây là cảnh báo thật: người dùng vừa bật "chỉ cột đang
                * hiện" mà file vẫn ra đủ trường. Tô hổ phách để nó không lẫn vào
                * hai dòng xám bên trên — im lặng ở đây chính là để người dùng
                * tin nhầm rằng mình đã lọc.
                */}
              <span
                className={cn(
                  "text-xs whitespace-normal",
                  chiCotDangHien && format.value === "json"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground",
                )}
              >
                {moTaCot(format.value)}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
