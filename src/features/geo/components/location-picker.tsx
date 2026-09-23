"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ListPlusIcon, TriangleAlertIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  SearchableCombobox,
  type ComboboxOption,
} from "@/features/geo/components/searchable-combobox";
import {
  useContinents,
  useCountries,
  useExpandedLocations,
  useProvinces,
  useWards,
} from "@/features/geo/hooks/use-geo";
import {
  buildExpandRequest,
  estimateQueryCount,
  formatDuration,
  EMPTY_SELECTION,
  GEO_ALL,
  GEO_SKIP,
  LOCATION_WARNING_THRESHOLD,
  SECONDS_PER_QUERY,
  type GeoSelection,
} from "@/features/geo/lib/geo-selection";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { errorMessage } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import type { GeoItem } from "@/features/geo/types";

/*
 * Bộ chọn địa điểm theo cấp: Châu lục -> Quốc gia -> Tỉnh/thành -> Phường/xã.
 *
 * Ba quy ước nghiệp vụ quyết định toàn bộ component này:
 *
 * 1. CHÂU LỤC CHỈ LÀ BỘ LỌC của ô quốc gia. Nó không bao giờ đi vào chuỗi địa
 *    điểm, vì "vựa trái cây Châu Á" là truy vấn vô nghĩa với Google Maps.
 * 2. "Tất cả" ở một cấp = TÁCH RA TỪNG MỤC ở cấp đó (Tỉnh = Tất cả với Việt Nam
 *    ra 34 dòng), còn "bỏ qua cấp này" = dừng lại ở cấp trên (ra đúng 1 dòng).
 * 3. Đổi cấp cha thì RESET mọi cấp con — giữ lại mã cũ sẽ tạo ra lựa chọn không
 *    tồn tại (vd tỉnh của nước khác).
 *
 * Việc ghép chuỗi do BACKEND làm (POST /geo/expand): trình duyệt không tải cả
 * cây địa giới về chỉ để nối chuỗi. Ô textarea của form mới là nguồn sự thật —
 * component này chỉ đưa các dòng ra ngoài qua `onAdd`.
 */

const CONTINENT_SPECIALS: ComboboxOption[] = [
  { value: GEO_ALL, label: "Tất cả châu lục", special: true },
];
const COUNTRY_SPECIALS: ComboboxOption[] = [
  { value: GEO_ALL, label: "Tất cả quốc gia", special: true },
];
const PROVINCE_SPECIALS: ComboboxOption[] = [
  { value: GEO_SKIP, label: "— Bỏ qua cấp này —", special: true },
  { value: GEO_ALL, label: "Tất cả tỉnh/thành", special: true },
];
const WARD_SPECIALS: ComboboxOption[] = [
  { value: GEO_SKIP, label: "— Bỏ qua cấp này —", special: true },
  { value: GEO_ALL, label: "Tất cả phường/xã", special: true },
];

const PREVIEW_SAMPLE_SIZE = 3;

function toOptions(items: GeoItem[] | undefined): ComboboxOption[] {
  return (items ?? []).map((item) => ({ value: item.code, label: item.name }));
}

function PickerField({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

interface LocationPickerProps {
  /** Số từ khoá đang nhập trong form — dùng để ước lượng số truy vấn sẽ sinh ra. */
  keywordCount: number;
  /** Đưa các dòng địa điểm ra cho form (form tự nối vào textarea và bỏ trùng). */
  onAdd: (locations: string[]) => void;
  onClear: () => void;
}

export function LocationPicker({
  keywordCount,
  onAdd,
  onClear,
}: LocationPickerProps) {
  const [selection, setSelection] = useState<GeoSelection>(EMPTY_SELECTION);

  const continents = useContinents();
  const countries = useCountries(selection.continent);
  const provinces = useProvinces(selection.country);
  const wards = useWards(selection.province);

  const continentOptions = useMemo(
    () => toOptions(continents.data),
    [continents.data],
  );
  const countryOptions = useMemo(
    () =>
      (countries.data ?? []).map((country) => ({
        value: country.code,
        label: country.name,
        searchText: country.name_en,
      })),
    [countries.data],
  );
  const provinceOptions = useMemo(
    () => toOptions(provinces.data),
    [provinces.data],
  );
  const wardOptions = useMemo(() => toOptions(wards.data), [wards.data]);

  const selectedCountry = useMemo(
    () =>
      (countries.data ?? []).find(
        (country) => country.code === selection.country,
      ) ?? null,
    [countries.data, selection.country],
  );

  /* Chỉ Việt Nam có dữ liệu cấp phường/xã (levels = 3). */
  const supportsWards = (selectedCountry?.levels ?? 0) >= 3;
  const provinceDisabled = selection.country === null;
  const wardDisabled = !supportsWards || selection.province === GEO_SKIP;

  const changeContinent = (value: string | null) =>
    setSelection({
      continent: value ?? GEO_ALL,
      country: null,
      province: GEO_SKIP,
      ward: GEO_SKIP,
    });
  const changeCountry = (value: string | null) =>
    setSelection((prev) => ({
      ...prev,
      country: value,
      province: GEO_SKIP,
      ward: GEO_SKIP,
    }));
  const changeProvince = (value: string | null) =>
    setSelection((prev) => ({
      ...prev,
      province: value ?? GEO_SKIP,
      ward: GEO_SKIP,
    }));
  const changeWard = (value: string | null) =>
    setSelection((prev) => ({ ...prev, ward: value ?? GEO_SKIP }));

  /*
   * Xem trước: debounce 300ms để kéo combobox liên tục không bắn một request
   * mỗi lần chạm. `request === debouncedRequest` cho biết đang trong lúc chờ.
   */
  const request = useMemo(() => buildExpandRequest(selection), [selection]);
  const debouncedRequest = useDebouncedValue(request, 300);
  const expanded = useExpandedLocations(debouncedRequest);
  const preview = request === null ? undefined : expanded.data;
  const computing =
    request !== null && (request !== debouncedRequest || expanded.isFetching);

  const total = preview?.total ?? 0;
  const lines = preview?.locations ?? [];
  const keywords = Math.max(keywordCount, 1);
  const queryCount = estimateQueryCount(total, keywords);
  const showWarning = total > LOCATION_WARNING_THRESHOLD;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <PickerField
          id="geo-continent"
          label="Châu lục"
          hint="Chỉ để lọc danh sách quốc gia."
        >
          <SearchableCombobox
            id="geo-continent"
            items={continentOptions}
            specialItems={CONTINENT_SPECIALS}
            value={selection.continent}
            onValueChange={changeContinent}
            placeholder="Tất cả châu lục"
            searchPlaceholder="Tìm châu lục..."
            loading={continents.isLoading}
          />
        </PickerField>

        <PickerField id="geo-country" label="Quốc gia">
          <SearchableCombobox
            id="geo-country"
            items={countryOptions}
            specialItems={COUNTRY_SPECIALS}
            value={selection.country}
            onValueChange={changeCountry}
            placeholder="Chọn quốc gia..."
            searchPlaceholder="Tìm quốc gia..."
            loading={countries.isLoading}
          />
        </PickerField>

        <PickerField
          id="geo-province"
          label="Tỉnh/thành"
          hint={
            selection.country === GEO_ALL
              ? "Chọn một quốc gia cụ thể để chọn từng tỉnh."
              : undefined
          }
        >
          <SearchableCombobox
            id="geo-province"
            items={provinceOptions}
            specialItems={PROVINCE_SPECIALS}
            value={selection.province}
            onValueChange={changeProvince}
            placeholder="— Bỏ qua cấp này —"
            searchPlaceholder="Tìm tỉnh/thành..."
            disabled={provinceDisabled}
            loading={provinces.isLoading}
          />
        </PickerField>

        <PickerField
          id="geo-ward"
          label="Phường/xã"
          hint={
            supportsWards
              ? selection.province === GEO_SKIP
                ? "Chọn tỉnh/thành trước để mở cấp này."
                : undefined
              : "Chỉ Việt Nam có dữ liệu cấp phường/xã."
          }
        >
          <SearchableCombobox
            id="geo-ward"
            items={wardOptions}
            specialItems={WARD_SPECIALS}
            value={selection.ward}
            onValueChange={changeWard}
            placeholder="— Bỏ qua cấp này —"
            searchPlaceholder="Tìm phường/xã..."
            disabled={wardDisabled}
            loading={wards.isLoading}
          />
        </PickerField>
      </div>

      <div className="space-y-1.5 rounded-lg border bg-muted/40 p-2.5">
        {request === null ? (
          <p className="text-xs text-muted-foreground">
            Chọn quốc gia để xem trước danh sách địa điểm.
          </p>
        ) : expanded.error ? (
          <p className="text-xs text-destructive">
            {errorMessage(expanded.error, "Không tính được danh sách địa điểm.")}
          </p>
        ) : (
          <>
            <p className="text-sm font-medium">
              {preview === undefined
                ? "Đang tính..."
                : `Sẽ thêm ${formatNumber(total)} địa điểm`}
              {preview !== undefined && computing ? (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  đang tính lại...
                </span>
              ) : null}
            </p>

            {lines.length > 0 ? (
              <ul className="space-y-0.5 font-mono text-xs text-muted-foreground">
                {lines.slice(0, PREVIEW_SAMPLE_SIZE).map((line) => (
                  <li key={line} className="truncate">
                    {line}
                  </li>
                ))}
                {total > PREVIEW_SAMPLE_SIZE ? (
                  <li className="truncate">
                    ... và {formatNumber(total - PREVIEW_SAMPLE_SIZE)} nơi khác
                  </li>
                ) : null}
              </ul>
            ) : null}

            {preview?.truncated ? (
              <p className="text-xs text-muted-foreground">
                Danh sách quá dài: chỉ thêm được {formatNumber(lines.length)}{" "}
                dòng đầu trong tổng số {formatNumber(total)}.
              </p>
            ) : null}

            {showWarning ? (
              <p className="flex items-start gap-1.5 rounded-md bg-amber-100 px-2 py-1.5 text-xs text-amber-900 dark:bg-amber-500/15 dark:text-amber-300">
                <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  {formatNumber(total)} địa điểm × {formatNumber(keywords)} từ
                  khoá = {formatNumber(queryCount)} truy vấn. Với nhịp mặc định,
                  mỗi truy vấn mất khoảng {SECONDS_PER_QUERY} giây tìm kiếm cộng
                  thời gian quét chi tiết — ước tính ít nhất{" "}
                  {formatDuration(queryCount * SECONDS_PER_QUERY)}.
                </span>
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => onAdd(lines)}
          disabled={lines.length === 0 || computing}
        >
          <ListPlusIcon />
          Thêm vào danh sách
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClear}>
          <Trash2Icon />
          Xoá hết địa điểm
        </Button>
      </div>
    </div>
  );
}
