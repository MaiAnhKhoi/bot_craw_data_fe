"use client";

import { FilterXIcon, SearchIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BUSINESS_STATUS_LABEL,
  LIVENESS_META,
  LIVENESS_ORDER,
} from "@/features/places/lib/liveness";
import type {
  BusinessStatus,
  LivenessLabel,
  PlaceFilters,
} from "@/features/places/types/place";

/*
 * Thanh lọc của màn Địa điểm.
 *
 * Component THUẦN GIAO DIỆN: nó không gọi API, không giữ state — nhận bộ lọc
 * hiện tại và một hàm `onChange`, trả về bộ lọc mới. Màn cha quyết định khi nào
 * gọi server (ô tìm kiếm được debounce ở đó). Nhờ tách như vậy, sửa giao diện
 * thanh lọc không bao giờ đụng tới tầng dữ liệu.
 *
 * Danh sách job và từ khoá do màn cha bơm xuống, vì chúng đến từ hai query khác.
 */

const ALL = "all";

interface Option {
  value: string;
  label: string;
}

/** Select một lựa chọn, luôn có mục "Tất cả" đứng đầu. */
function FilterSelect({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const all: Option = { value: ALL, label };
  const items = [all, ...options];
  const current = items.find((option) => option.value === value) ?? all;

  return (
    <Select
      value={value}
      onValueChange={(next) => next && onChange(next as string)}
    >
      <SelectTrigger className={className}>
        <SelectValue>{() => current.label}</SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {items.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const BOOLEAN_OPTIONS: Option[] = [
  { value: "true", label: "Có" },
  { value: "false", label: "Không" },
];

const RATING_OPTIONS: Option[] = [
  { value: "3", label: "Từ 3.0 sao" },
  { value: "4", label: "Từ 4.0 sao" },
  { value: "4.5", label: "Từ 4.5 sao" },
];

const BUSINESS_STATUS_OPTIONS: Option[] = (
  Object.keys(BUSINESS_STATUS_LABEL) as BusinessStatus[]
).map((status) => ({ value: status, label: BUSINESS_STATUS_LABEL[status] }));

function parseBoolean(value: string): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function PlacesFilters({
  filters,
  search,
  onSearchChange,
  onChange,
  onReset,
  jobOptions,
  keywordOptions,
}: {
  filters: PlaceFilters;
  /** Giá trị ĐANG GÕ (chưa debounce) — giữ riêng để ô nhập không bị giật. */
  search: string;
  onSearchChange: (value: string) => void;
  onChange: (next: PlaceFilters) => void;
  onReset: () => void;
  jobOptions: Option[];
  keywordOptions: Option[];
}) {
  const liveness = filters.liveness ?? [];

  const toggleLiveness = (label: LivenessLabel, checked: boolean) => {
    const next = checked
      ? [...liveness, label]
      : liveness.filter((item) => item !== label);
    onChange({ ...filters, liveness: next.length > 0 ? next : undefined });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b p-3">
      <div className="relative min-w-52 flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm theo tên hoặc địa chỉ..."
          className="pl-8"
          aria-label="Tìm địa điểm"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
          Tình trạng
          {liveness.length > 0 ? (
            <Badge variant="secondary" className="ml-1">
              {liveness.length}
            </Badge>
          ) : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {LIVENESS_ORDER.map((label) => (
            <DropdownMenuCheckboxItem
              key={label}
              checked={liveness.includes(label)}
              onCheckedChange={(checked) => toggleLiveness(label, checked)}
            >
              {LIVENESS_META[label].label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <FilterSelect
        label="Có SĐT"
        className="w-32"
        value={
          filters.has_phone === undefined ? ALL : String(filters.has_phone)
        }
        options={BOOLEAN_OPTIONS}
        onChange={(value) =>
          onChange({ ...filters, has_phone: parseBoolean(value) })
        }
      />

      <FilterSelect
        label="Có website"
        className="w-36"
        value={
          filters.has_website === undefined ? ALL : String(filters.has_website)
        }
        options={BOOLEAN_OPTIONS}
        onChange={(value) =>
          onChange({ ...filters, has_website: parseBoolean(value) })
        }
      />

      <FilterSelect
        label="Trạng thái KD"
        className="w-44"
        value={filters.business_status ?? ALL}
        options={BUSINESS_STATUS_OPTIONS}
        onChange={(value) =>
          onChange({
            ...filters,
            business_status:
              value === ALL ? undefined : (value as BusinessStatus),
          })
        }
      />

      <FilterSelect
        label="Mọi đánh giá"
        className="w-36"
        value={filters.min_rating === undefined ? ALL : String(filters.min_rating)}
        options={RATING_OPTIONS}
        onChange={(value) =>
          onChange({
            ...filters,
            min_rating: value === ALL ? undefined : Number(value),
          })
        }
      />

      <FilterSelect
        label="Mọi job"
        className="w-44"
        value={filters.job_id === undefined ? ALL : String(filters.job_id)}
        options={jobOptions}
        onChange={(value) =>
          onChange({
            ...filters,
            job_id: value === ALL ? undefined : Number(value),
          })
        }
      />

      <FilterSelect
        label="Mọi từ khoá"
        className="w-48"
        value={filters.keyword ?? ALL}
        options={keywordOptions}
        onChange={(value) =>
          onChange({ ...filters, keyword: value === ALL ? undefined : value })
        }
      />

      <Button variant="ghost" size="sm" onClick={onReset}>
        <FilterXIcon />
        Xoá lọc
      </Button>
    </div>
  );
}
