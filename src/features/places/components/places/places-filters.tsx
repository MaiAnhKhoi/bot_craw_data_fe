"use client";

import { useState } from "react";
import {
  FilterXIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
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
  SearchableCombobox,
  type ComboboxOption,
} from "@/features/geo/components/searchable-combobox";
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
 * Danh sách job, từ khoá và quốc gia do màn cha bơm xuống, vì chúng đến từ những
 * query khác.
 *
 * Ô "Quốc gia" dùng `SearchableCombobox` của module Địa giới thay vì `Select`
 * như các ô còn lại: danh mục có thể lên tới hàng trăm nước, cuộn tay một danh
 * sách dài như vậy là cực hình — component kia đã có sẵn ô tìm kiếm trong popup
 * và bộ lọc bỏ dấu (gõ "thai" ra "Thái Lan"). Đây là phụ thuộc chéo feature có
 * chủ ý và CHỈ ở tầng trình bày: một combobox không biết gì về nghiệp vụ địa giới.
 */

import { cn } from "@/lib/utils";

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

/*
 * Mục "Mọi quốc gia" ghim đầu danh sách. Mượn luôn sentinel `ALL` của các ô lọc
 * khác — mã ISO alpha-2 luôn viết hoa nên không đời nào đụng chuỗi "all".
 */
const COUNTRY_SPECIALS: ComboboxOption[] = [
  { value: ALL, label: "Mọi quốc gia", special: true },
];

const QUERY_SPECIALS: ComboboxOption[] = [
  { value: ALL, label: "Mọi lượt tìm", special: true },
];

/*
 * Số bộ lọc ĐANG BẬT — để nút "Bộ lọc" trên mobile nói được là có đang lọc hay
 * không. Cố ý KHÔNG đếm `q` (ô tìm kiếm luôn hiện, người dùng nhìn thấy nó) và
 * `sort` (sắp xếp không phải lọc, luôn có giá trị nên đếm vào thì lúc nào cũng
 * hiện số 1).
 */
function countActiveFilters(filters: PlaceFilters): number {
  return [
    filters.liveness?.length ? 1 : 0,
    filters.has_phone !== undefined ? 1 : 0,
    filters.has_website !== undefined ? 1 : 0,
    filters.business_status !== undefined ? 1 : 0,
    filters.min_rating !== undefined ? 1 : 0,
    filters.job_id !== undefined ? 1 : 0,
    filters.keyword !== undefined ? 1 : 0,
    filters.country !== undefined ? 1 : 0,
  ].reduce((total, one) => total + one, 0);
}

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
  queryOptions,
  queriesLoading,
  countryOptions,
  countriesLoading,
}: {
  filters: PlaceFilters;
  /** Giá trị ĐANG GÕ (chưa debounce) — giữ riêng để ô nhập không bị giật. */
  search: string;
  onSearchChange: (value: string) => void;
  onChange: (next: PlaceFilters) => void;
  onReset: () => void;
  jobOptions: Option[];
  /** Nhãn đã kèm số lượng — màn cha dựng sẵn. */
  queryOptions: ComboboxOption[];
  queriesLoading?: boolean;
  /** Nhãn đã kèm số lượng ("Thái Lan (6)") — màn cha dựng sẵn. */
  countryOptions: ComboboxOption[];
  countriesLoading?: boolean;
}) {
  const liveness = filters.liveness ?? [];

  const toggleLiveness = (label: LivenessLabel, checked: boolean) => {
    const next = checked
      ? [...liveness, label]
      : liveness.filter((item) => item !== label);
    onChange({ ...filters, liveness: next.length > 0 ? next : undefined });
  };

  const [open, setOpen] = useState(false);
  const activeCount = countActiveFilters(filters);

  return (
    <div className="space-y-2 border-b p-3">
      {/*
       * Hàng luôn hiện: ô tìm kiếm + nút mở bộ lọc (chỉ dưới lg).
       *
       * Ở bề ngang 375px, tám ô chọn xếp dọc chiếm trọn màn hình đầu tiên —
       * người dùng phải cuộn qua một bức tường dropdown mới thấy được dòng dữ
       * liệu nào. Gấp lại sau một nút, kèm số bộ lọc đang bật để không ai quên
       * mình đang lọc mà tưởng bảng hết dữ liệu.
       */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm theo tên hoặc địa chỉ..."
            className="pl-8"
            aria-label="Tìm địa điểm"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 lg:hidden"
          aria-expanded={open}
          aria-controls="place-filters"
          onClick={() => setOpen((previous) => !previous)}
        >
          <SlidersHorizontalIcon />
          Bộ lọc
          {activeCount > 0 ? (
            <Badge variant="secondary" className="ml-1">
              {activeCount}
            </Badge>
          ) : null}
        </Button>
      </div>

      <div
        id="place-filters"
        className={cn(
          "flex-wrap items-center gap-2 lg:flex",
          open ? "flex" : "hidden",
        )}
      >
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

      {/*
        * Combobox chứ không Select, và nhãn là "lượt tìm" chứ không "từ khoá":
        *  - Giá trị ở đây là CẢ CHUỖI TRUY VẤN ("fruit wholesaler Phuket,
        *    Thailand"), tức đúng thứ đã gửi lên Google Maps. Gọi là "từ khoá"
        *    khiến người dùng tưởng nó chỉ lọc theo từ, rồi không hiểu vì sao
        *    không tách được địa điểm của từng địa bàn.
        *  - Quét 34 tỉnh là ra hơn 34 lượt; quét tới phường/xã là hàng nghìn.
        *    Một Select không có ô tìm kiếm thì vô dụng ở kích thước đó.
        */}
      <SearchableCombobox
        className="w-56"
        items={queryOptions}
        specialItems={QUERY_SPECIALS}
        value={filters.keyword ?? ALL}
        onValueChange={(value) =>
          onChange({
            ...filters,
            keyword: !value || value === ALL ? undefined : value,
          })
        }
        placeholder="Mọi lượt tìm"
        searchPlaceholder="Tìm theo từ khoá hoặc địa bàn..."
        emptyText="Không có lượt tìm nào khớp."
        loading={queriesLoading}
      />

      <SearchableCombobox
        className="w-44"
        items={countryOptions}
        specialItems={COUNTRY_SPECIALS}
        value={filters.country ?? ALL}
        onValueChange={(value) =>
          onChange({
            ...filters,
            /* `null` xảy ra khi Base UI bỏ chọn — cùng nghĩa với "Mọi quốc gia". */
            country: !value || value === ALL ? undefined : value,
          })
        }
        placeholder="Mọi quốc gia"
        searchPlaceholder="Tìm quốc gia..."
        emptyText="Không có quốc gia nào khớp."
        loading={countriesLoading}
      />

      <Button variant="ghost" size="sm" onClick={onReset}>
        <FilterXIcon />
        Xoá lọc
      </Button>
      </div>
    </div>
  );
}
