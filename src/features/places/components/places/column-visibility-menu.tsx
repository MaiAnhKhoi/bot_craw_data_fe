"use client";

import type { VisibilityState } from "@tanstack/react-table";
import { Columns3Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PLACE_COLUMN_LABELS,
  placeColumns,
} from "@/features/places/components/places/place-columns";

/*
 * Menu ẩn/hiện cột của bảng Địa điểm.
 *
 * Không nhận instance TanStack Table mà chỉ nhận state ẩn/hiện: nhờ vậy menu
 * sống độc lập ở thanh công cụ phía trên, không phải luồn table instance qua
 * ba tầng component chỉ để vẽ một danh sách checkbox.
 *
 * Cột "Hành động" không tắt được (`enableHiding: false`) — tắt nó đi thì không
 * còn cách nào mở Google Maps hay bấm kiểm tra lại.
 */
const HIDEABLE_COLUMN_IDS = placeColumns
  .filter((column) => column.enableHiding !== false)
  .map((column) => column.id as string);

export function ColumnVisibilityMenu({
  visibility,
  onChange,
}: {
  visibility: VisibilityState;
  onChange: (next: VisibilityState) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <Columns3Icon />
        Cột
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Hiện cột</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {HIDEABLE_COLUMN_IDS.map((id) => (
          <DropdownMenuCheckboxItem
            key={id}
            checked={visibility[id] !== false}
            onCheckedChange={(checked) =>
              onChange({ ...visibility, [id]: checked })
            }
          >
            {PLACE_COLUMN_LABELS[id] ?? id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
