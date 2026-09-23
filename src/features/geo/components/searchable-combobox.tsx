"use client";

import { useMemo } from "react";
import { LoaderCircleIcon } from "lucide-react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { foldText } from "@/features/geo/lib/geo-selection";
import { cn } from "@/lib/utils";

/*
 * Combobox một lựa chọn, có ô tìm kiếm NẰM TRONG popup.
 *
 * Vì sao kiểu "ô tìm kiếm trong popup" chứ không phải input-làm-trigger: nút đóng
 * hiện đúng nhãn đang chọn như một Select bình thường (form nhìn nhất quán với
 * các ô còn lại), còn ô nhập chỉ xuất hiện khi cần lọc. Nhờ vậy `placeholder`
 * (khi chưa chọn) và `searchPlaceholder` (gợi ý gõ tìm) là hai chỗ khác nhau.
 *
 * Danh sách được lọc TẠI CHỖ bằng `foldText` — mỗi cấp nhiều nhất ~250 mục, gọi
 * server mỗi phím gõ là lãng phí (Rule 1).
 */

export interface ComboboxOption {
  value: string;
  label: string;
  /** Chuỗi phụ cũng được đem so khi tìm (vd tên tiếng Anh của quốc gia). */
  searchText?: string;
  /** Mục đặc biệt (Tất cả / bỏ qua cấp này): luôn ghim đầu danh sách, in đậm. */
  special?: boolean;
}

function matches(option: ComboboxOption, query: string): boolean {
  const needle = foldText(query);
  if (!needle) return true;
  if (foldText(option.label).includes(needle)) return true;
  return option.searchText
    ? foldText(option.searchText).includes(needle)
    : false;
}

interface SearchableComboboxProps {
  /** Danh sách thật của cấp này (đã tải từ server). */
  items: ComboboxOption[];
  /** Mục ghim đầu danh sách: "Tất cả", "— bỏ qua cấp này —". */
  specialItems?: ComboboxOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText?: string;
  disabled?: boolean;
  loading?: boolean;
  id?: string;
  className?: string;
}

const NO_SPECIAL_ITEMS: ComboboxOption[] = [];

export function SearchableCombobox({
  items,
  specialItems = NO_SPECIAL_ITEMS,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyText = "Không tìm thấy.",
  disabled = false,
  loading = false,
  id,
  className,
}: SearchableComboboxProps) {
  const options = useMemo(
    () => (specialItems.length > 0 ? [...specialItems, ...items] : items),
    [specialItems, items],
  );

  /*
   * Bên ngoài chỉ giữ MÃ (chuỗi) cho gọn; Base UI lại nhận cả object item làm
   * giá trị. Dò lại object tương ứng ở đây để hai bên không phải biết về nhau.
   */
  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  return (
    <Combobox<ComboboxOption>
      items={options}
      value={selected}
      onValueChange={(next) => onValueChange(next ? next.value : null)}
      isItemEqualToValue={(itemValue, currentValue) =>
        itemValue?.value === currentValue?.value
      }
      filter={(item, query) => matches(item, query)}
      disabled={disabled}
    >
      <ComboboxTrigger
        id={id}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50",
          className,
        )}
      >
        {loading ? (
          <LoaderCircleIcon className="size-3.5 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none" />
        ) : null}
        <ComboboxValue>
          {(current: ComboboxOption | null) => (
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-left",
                current ? undefined : "text-muted-foreground",
              )}
            >
              {current ? current.label : placeholder}
            </span>
          )}
        </ComboboxValue>
      </ComboboxTrigger>

      <ComboboxContent>
        <ComboboxInput
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          showTrigger={false}
        />
        <ComboboxEmpty>{loading ? "Đang tải..." : emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(item: ComboboxOption) => (
            <ComboboxItem
              key={item.value}
              value={item}
              className={item.special ? "font-medium" : undefined}
            >
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
