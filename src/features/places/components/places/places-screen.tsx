"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { MapPinnedIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
import { DEFAULT_PAGE_SIZE, ROUTES } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { ColumnVisibilityMenu } from "@/features/places/components/places/column-visibility-menu";
import { ExportButton } from "@/features/places/components/places/export-button";
import {
  PLACE_COLUMN_LABELS,
  placeColumns,
} from "@/features/places/components/places/place-columns";
import { PlacesFilters } from "@/features/places/components/places/places-filters";
import { PlacesTable } from "@/features/places/components/places/places-table";
import { useColumnVisibility } from "@/features/places/hooks/use-column-visibility";
import { usePlaceEvents } from "@/features/places/hooks/use-place-events";
import {
  usePlaceCountries,
  usePlaceQueries,
  usePlaces,
} from "@/features/places/hooks/use-places";
import { useJobs } from "@/features/jobs/hooks/use-jobs";
import type { ComboboxOption } from "@/features/geo/components/searchable-combobox";
import type { PlaceFilters, PlaceSort } from "@/features/places/types/place";

/*
 * Màn Địa điểm — bảng chính của công cụ.
 *
 * Màn này là nơi DUY NHẤT giữ state lọc/sắp/phân trang, rồi bơm xuống ba
 * component con (thanh lọc, bảng, thanh phân trang). Một nguồn sự thật, nên
 * nút "Xuất file" chắc chắn tải về đúng tập dữ liệu đang hiển thị.
 *
 * GHI CHÚ VỀ PHỤ THUỘC CHÉO FEATURE: danh sách job và danh sách từ khoá lấy từ
 * hook của module Jobs và Stats. Hai query đó đã nằm sẵn trong cache (màn Job
 * và màn Tổng quan dùng chúng), nên tái sử dụng rẻ hơn hẳn so với viết thêm một
 * endpoint/hook riêng cho ô lọc. Đây là ngoại lệ có chủ ý và chỉ ở tầng HOOK —
 * module Địa điểm không đụng vào component hay state nội bộ của hai module kia.
 */

const PAGE_SIZE_OPTIONS = [50, 100, 200];
const DEFAULT_SORT: PlaceSort = "-liveness";

/** Cột hiện mặc định — dùng cho skeleton để không nhảy layout khi dữ liệu về. */
const SKELETON_COLUMNS = placeColumns.map(
  (column) => PLACE_COLUMN_LABELS[column.id as string] ?? "",
);

export function PlacesScreen() {
  const searchParams = useSearchParams();

  /*
   * Bộ lọc khởi tạo từ URL: màn Tổng quan và màn chi tiết job dẫn sang đây kèm
   * ?job_id= hoặc ?keyword=. Chỉ đọc MỘT LẦN lúc dựng — sau đó bộ lọc thuộc về
   * màn này, nếu đồng bộ ngược lại URL thì mỗi lần gõ phím sẽ push một entry
   * vào lịch sử trình duyệt.
   */
  const [filters, setFilters] = useState<PlaceFilters>(() => {
    const jobId = Number(searchParams.get("job_id"));
    const keyword = searchParams.get("keyword");
    return {
      job_id: Number.isInteger(jobId) && jobId > 0 ? jobId : undefined,
      keyword: keyword ?? undefined,
      sort: DEFAULT_SORT,
    };
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility();

  const debouncedSearch = useDebouncedValue(search, 400);

  /*
   * Gõ từ khoá mới thì về trang 1 NGAY tại sự kiện gõ, không đợi debounce và
   * cũng không dùng useEffect: đặt lại state trong effect chỉ tạo thêm một vòng
   * render thừa, mà request thì vẫn chỉ bắn sau 400ms như cũ.
   */
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const appliedFilters = useMemo<PlaceFilters>(
    () => ({ ...filters, q: debouncedSearch.trim() || undefined }),
    [filters, debouncedSearch],
  );

  const { data, isPending, isError, error, refetch, isFetching } = usePlaces({
    ...appliedFilters,
    page,
    size,
  });

  /* Nguồn dữ liệu cho hai ô lọc — xem ghi chú phụ thuộc chéo ở đầu file. */
  const { data: jobsPage } = useJobs({ page: 1, size: 100 });

  /* Ô lọc quốc gia thì ngược lại: endpoint riêng của chính module Địa điểm. */
  const { data: countries, isPending: countriesPending } = usePlaceCountries();

  /*
   * Theo dõi dữ liệu mới theo thời gian thực. Không nhận giá trị trả về:
   * hook tự gọi invalidate, `usePlaces` ở trên nạp lại và bảng tự vẽ lại.
   */
  usePlaceEvents();

  const jobOptions = useMemo(
    () =>
      (jobsPage?.items ?? []).map((job) => ({
        value: String(job.id),
        label: job.name,
      })),
    [jobsPage],
  );

  /*
   * Danh sách LƯỢT TÌM lấy từ endpoint riêng, KHÔNG dùng `overview.top_keywords`
   * như trước: cái đó có LIMIT 10 ở backend, nên quét từ địa bàn thứ 11 trở đi là
   * những lượt tìm đó biến mất khỏi ô lọc mà không có cảnh báo nào — người dùng
   * tưởng dữ liệu bị gộp chung không tách ra được.
   */
  const { data: placeQueries, isPending: queriesPending } = usePlaceQueries();
  const queryOptions = useMemo(
    () =>
      (placeQueries ?? []).map((row) => ({
        value: row.query,
        label: `${row.query} (${formatNumber(row.count)})`,
        searchText: row.query,
      })),
    [placeQueries],
  );

  /*
   * Số lượng nằm ngay trong nhãn ("Thái Lan (6)") để người dùng biết chọn nước
   * nào là bõ công trước khi bảng tải lại.
   *
   * `searchText` là mã ISO: người quen việc gõ "TH" nhanh hơn gõ "Thái Lan",
   * còn tên có dấu thì combobox đã tự gấp dấu khi so khớp.
   */
  const countryOptions = useMemo<ComboboxOption[]>(
    () =>
      (countries ?? []).map((country) => ({
        value: country.code,
        label: `${country.name} (${formatNumber(country.count)})`,
        searchText: country.code,
      })),
    [countries],
  );

  const handleFiltersChange = (next: PlaceFilters) => {
    setFilters(next);
    setPage(1);
  };

  const handleReset = () => {
    setFilters({ sort: DEFAULT_SORT });
    setSearch("");
    setPage(1);
  };

  /*
   * Job mà bảng đang bị lọc theo. Dựa vào BỘ LỌC HIỆN TẠI chứ không phải query
   * string lúc vào trang: người dùng tới đây từ nút "Xem địa điểm của job" thì
   * hai thứ trùng nhau, nhưng nếu họ tự chọn job trong ô lọc thì chỉ bộ lọc là
   * đúng. Nhờ vậy đường quay lại luôn khớp với thứ đang nhìn thấy.
   */
  const jobDangLoc = useMemo(
    () =>
      filters.job_id === undefined
        ? null
        : (jobsPage?.items ?? []).find((job) => job.id === filters.job_id),
    [filters.job_id, jobsPage],
  );

  return (
    <div className="space-y-4">
      {/*
        * Đường quay lại job. Thiếu nó thì vào từ màn chi tiết job là cụt đường:
        * bảng hiện ra nhưng không còn lối nào về job vừa xem, phải bấm nút Back
        * của trình duyệt hoặc đi vòng qua menu rồi tìm lại job đó.
        */}
      {filters.job_id !== undefined ? (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground"
          nativeButton={false}
          render={<Link href={ROUTES.jobDetail(filters.job_id)} />}
        >
          <ArrowLeftIcon />
          {jobDangLoc ? `Về job "${jobDangLoc.name}"` : "Về job"}
        </Button>
      ) : null}

      <PageHeader
        title="Địa điểm"
        description="Toàn bộ lead đã thu thập: tên công ty, vị trí, số điện thoại, website."
        actions={
          <>
            <ColumnVisibilityMenu
              visibility={columnVisibility}
              onChange={setColumnVisibility}
            />
            {/*
              * Nút xuất nhận CÙNG state cột với `ColumnVisibilityMenu` ở trên,
              * nhờ vậy lựa chọn "chỉ xuất các cột đang hiện" đọc đúng thứ người
              * dùng vừa tắt. Luồn qua props chứ không để ExportButton tự gọi
              * `useColumnVisibility`: hook đó giữ state riêng, hai bản sao sẽ
              * lệch nhau ngay lần tắt cột đầu tiên và file xuất ra một đằng,
              * bảng hiện một nẻo.
              */}
            <ExportButton
              filters={appliedFilters}
              columnVisibility={columnVisibility}
              disabled={!data || data.total === 0}
            />
          </>
        }
      />

      <Card size="sm" className="gap-0 py-0">
        <PlacesFilters
          filters={filters}
          search={search}
          onSearchChange={handleSearchChange}
          onChange={handleFiltersChange}
          onReset={handleReset}
          jobOptions={jobOptions}
          queryOptions={queryOptions}
          queriesLoading={queriesPending}
          countryOptions={countryOptions}
          countriesLoading={countriesPending}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 text-sm text-muted-foreground">
          <span>
            {data ? `${formatNumber(data.total)} địa điểm` : "Đang tải..."}
          </span>
          <label className="flex items-center gap-2">
            Số dòng mỗi trang
            <Select
              value={String(size)}
              onValueChange={(value) => {
                if (!value) return;
                setSize(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger size="sm" className="w-20">
                <SelectValue>{() => String(size)}</SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>

        {isPending ? (
          <TableSkeleton columns={SKELETON_COLUMNS} rows={10} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={<MapPinnedIcon className="size-5" />}
            title="Không có địa điểm nào khớp bộ lọc"
            description="Thử bỏ bớt điều kiện lọc, hoặc tạo một job quét mới cho từ khoá khác."
          />
        ) : (
          <>
            <div
              className={
                isFetching ? "opacity-60 transition-opacity" : undefined
              }
            >
              <PlacesTable
                places={data.items}
                columnVisibility={columnVisibility}
                sort={filters.sort ?? DEFAULT_SORT}
                onSortChange={(sort) => handleFiltersChange({ ...filters, sort })}
              />
            </div>
            <PaginationBar
              page={data.page}
              size={data.size}
              total={data.total}
              pages={data.pages}
              onPageChange={setPage}
              disabled={isFetching}
            />
          </>
        )}
      </Card>
    </div>
  );
}
