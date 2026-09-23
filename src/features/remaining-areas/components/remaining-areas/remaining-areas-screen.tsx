"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
  ALL_STOP_REASONS,
  STOP_REASON_FILTER_OPTIONS,
} from "@/features/remaining-areas/lib/remaining-areas";
import {
  REMAINING_AREA_COLUMNS,
  RemainingAreasTable,
} from "@/features/remaining-areas/components/remaining-areas/remaining-areas-table";
import { useRemainingAreas } from "@/features/remaining-areas/hooks/use-remaining-areas";
import type { RemainingStopReason } from "@/features/remaining-areas/types/remaining-area";

/*
 * Màn "Địa bàn còn sót".
 *
 * Google chỉ trả khoảng 110-120 kết quả cho mỗi truy vấn, dù địa bàn còn hàng
 * nghìn doanh nghiệp. Cách duy nhất vượt qua là chia nhỏ địa bàn — nhưng chia
 * nhỏ TẤT CẢ thì 34 tỉnh phình thành 3.321 phường/xã, chạy cả tuần. Việc cần
 * làm là chia nhỏ ĐÚNG những tỉnh bị cắt giữa chừng.
 *
 * Dữ liệu để biết tỉnh nào bị cắt đã nằm sẵn trong `job_queries.stop_reason` từ
 * lâu, nhưng trước trang này nó chỉ xem được bên trong từng job: quét xong 34
 * tỉnh là phải mở 34 lần chi tiết job ra dò tay. Trang này gộp qua mọi job và
 * chỉ giữ lần quét gần nhất của mỗi địa bàn.
 */

export function RemainingAreasScreen() {
  const [page, setPage] = useState(1);
  const [stopReason, setStopReason] = useState<string>(ALL_STOP_REASONS);

  const { data, isPending, isError, error, refetch, isFetching } =
    useRemainingAreas({
      page,
      size: DEFAULT_PAGE_SIZE,
      stop_reason:
        stopReason === ALL_STOP_REASONS
          ? undefined
          : (stopReason as RemainingStopReason),
    });

  const currentLabel =
    STOP_REASON_FILTER_OPTIONS.find((option) => option.value === stopReason)
      ?.label ?? STOP_REASON_FILTER_OPTIONS[0].label;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Địa bàn còn sót"
        description="Những truy vấn Google chưa trả hết: chia nhỏ xuống phường/xã, nâng trần kết quả, hoặc chạy lại."
      />

      <Card size="sm" className="gap-0 py-0">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <Select
            value={stopReason}
            onValueChange={(value) => {
              if (!value) return;
              setStopReason(value as string);
              // Trang 5 của bộ lọc cũ gần như chắc chắn không tồn tại ở bộ lọc
              // mới — không quay về trang 1 là người dùng nhận một bảng rỗng.
              setPage(1);
            }}
          >
            {/*
              * Mobile-first: ô lọc chiếm trọn bề ngang ở điện thoại (ở 375px,
              * một ô rộng cố định vừa thừa chỗ trống vừa dễ tràn), chỉ thu lại
              * bề rộng cố định từ sm trở lên.
              */}
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue>{() => currentLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {STOP_REASON_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isPending ? (
          <TableSkeleton columns={REMAINING_AREA_COLUMNS} rows={6} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <>
            {/*
              * Giữ dữ liệu cũ khi đổi trang (keepPreviousData) và chỉ làm mờ đi
              * — bảng không nháy về skeleton giữa chừng.
              */}
            <div
              className={isFetching ? "opacity-60 transition-opacity" : undefined}
            >
              <RemainingAreasTable areas={data.items} />
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
