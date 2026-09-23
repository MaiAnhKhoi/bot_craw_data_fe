"use client";

import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { placesExportUrl } from "@/features/places/api/places-api";
import { useAuthStore } from "@/stores/auth-store";
import type { ExportFormat, PlaceFilters } from "@/features/places/types/place";

/*
 * Nút xuất Excel/CSV.
 *
 * CỐ Ý không fetch blob rồi tạo object URL: file có thể tới 100.000 dòng, kéo
 * hết vào RAM là cách chắc chắn nhất làm treo tab. Ở đây ta tạo thẻ <a download>
 * rồi bấm nó — trình duyệt tải bằng cơ chế tải file bình thường, có thanh tiến
 * độ, tạm dừng, và không giữ gì trong bộ nhớ của trang.
 *
 * Bộ lọc truyền vào là ĐÚNG bộ lọc bảng đang dùng, nên file tải về luôn khớp
 * với thứ người dùng đang nhìn.
 */
const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "xlsx", label: "Excel (.xlsx)" },
  { value: "csv", label: "CSV (.csv)" },
  { value: "json", label: "JSON (.json)" },
];

export function ExportButton({
  filters,
  disabled,
}: {
  filters: PlaceFilters;
  disabled?: boolean;
}) {
  const token = useAuthStore((state) => state.token);

  const download = (format: ExportFormat) => {
    if (!token) return;
    const link = document.createElement("a");
    link.href = placesExportUrl(filters, format, token);
    link.download = "";
    link.rel = "noreferrer noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" disabled={disabled} />}
      >
        <DownloadIcon />
        Xuất file
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {FORMATS.map((format) => (
          <DropdownMenuItem
            key={format.value}
            onClick={() => download(format.value)}
          >
            {format.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
