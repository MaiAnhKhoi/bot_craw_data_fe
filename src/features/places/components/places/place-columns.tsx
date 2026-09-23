"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/shared/copy-button";
import { formatNumber, shortenUrl } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  BUSINESS_STATUS_LABEL,
  WEBSITE_STATUS_META,
} from "@/features/places/lib/liveness";
import { LivenessCell } from "@/features/places/components/places/liveness-cell";
import { PlaceActionsCell } from "@/features/places/components/places/place-actions-cell";
import type { Place } from "@/features/places/types/place";

/*
 * Định nghĩa cột của bảng Địa điểm (TanStack Table v8).
 *
 * `id` của cột nào sắp xếp được thì TRÙNG với khoá `sort` của backend
 * (docs/API_CONTRACT.md §3) — nhờ vậy bảng chỉ việc gửi thẳng id lên server,
 * không cần thêm một bảng ánh xạ dễ lệch.
 *
 * Bốn cột đầu là 4 trường bắt buộc theo yêu cầu nghiệp vụ: tên công ty, vị trí,
 * số điện thoại, website.
 */

/** Cột sắp xếp được ở SERVER. Cột không có trong đây thì không hiện nút sắp xếp. */
export const SORTABLE_COLUMN_IDS = new Set([
  "name",
  "liveness",
  "rating",
  "review_count",
]);

/** Nhãn tiếng Việt của từng cột — dùng cho menu ẩn/hiện cột và skeleton. */
export const PLACE_COLUMN_LABELS: Record<string, string> = {
  name: "Tên công ty",
  address: "Vị trí",
  phone: "SĐT",
  website: "Website",
  liveness: "Tình trạng",
  category: "Danh mục",
  rating: "Đánh giá",
  review_count: "Lượt đánh giá",
  actions: "Hành động",
};

const DASH = "—";

export const placeColumns: ColumnDef<Place>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: PLACE_COLUMN_LABELS.name,
    cell: ({ row }) => {
      const place = row.original;
      return (
        <div className="max-w-64">
          <p className="truncate font-medium">{place.name}</p>
          {place.business_status !== "OPERATIONAL" ? (
            <p className="truncate text-xs text-destructive">
              {BUSINESS_STATUS_LABEL[place.business_status]}
            </p>
          ) : null}
        </div>
      );
    },
  },
  {
    id: "address",
    accessorKey: "address",
    header: PLACE_COLUMN_LABELS.address,
    cell: ({ row }) => (
      <p className="max-w-72 truncate text-muted-foreground">
        {row.original.address ?? DASH}
      </p>
    ),
  },
  {
    id: "phone",
    accessorKey: "phone",
    header: PLACE_COLUMN_LABELS.phone,
    cell: ({ row }) => {
      const place = row.original;
      if (!place.phone) {
        return <span className="text-muted-foreground">{DASH}</span>;
      }
      return (
        <span className="inline-flex items-center gap-1">
          <a
            href={`tel:${place.phone_e164 ?? place.phone}`}
            className={cn(
              "tabular-nums hover:underline",
              place.phone_valid === false && "text-amber-600 dark:text-amber-400",
            )}
          >
            {place.phone}
          </a>
          <CopyButton
            value={place.phone_e164 ?? place.phone}
            label={`Sao chép số của ${place.name}`}
          />
        </span>
      );
    },
  },
  {
    id: "website",
    accessorKey: "website",
    header: PLACE_COLUMN_LABELS.website,
    cell: ({ row }) => {
      const place = row.original;
      const status = WEBSITE_STATUS_META[place.website_status];
      if (!place.website) {
        return (
          <Badge variant="secondary" className={status.badgeClass}>
            {status.label}
          </Badge>
        );
      }
      return (
        <span className="inline-flex max-w-56 items-center gap-1.5">
          <a
            href={place.website}
            target="_blank"
            rel="noreferrer noopener"
            className="truncate hover:underline"
          >
            {shortenUrl(place.website)}
          </a>
          <Badge
            variant="secondary"
            className={cn("shrink-0", status.badgeClass)}
          >
            {status.label}
          </Badge>
        </span>
      );
    },
  },
  {
    id: "liveness",
    accessorKey: "liveness_score",
    header: PLACE_COLUMN_LABELS.liveness,
    cell: ({ row }) => <LivenessCell place={row.original} />,
  },
  {
    id: "category",
    accessorKey: "category",
    header: PLACE_COLUMN_LABELS.category,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.category ?? DASH}
      </span>
    ),
  },
  {
    id: "rating",
    accessorKey: "rating",
    header: PLACE_COLUMN_LABELS.rating,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.rating === null ? DASH : row.original.rating.toFixed(1)}
      </span>
    ),
  },
  {
    id: "review_count",
    accessorKey: "review_count",
    header: PLACE_COLUMN_LABELS.review_count,
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {formatNumber(row.original.review_count)}
      </span>
    ),
  },
  {
    id: "actions",
    header: PLACE_COLUMN_LABELS.actions,
    enableHiding: false,
    cell: ({ row }) => <PlaceActionsCell place={row.original} />,
  },
];
