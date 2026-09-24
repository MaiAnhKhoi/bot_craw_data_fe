"use client";

import { useCallback, useState } from "react";
import { ScissorsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { formatNumber } from "@/lib/format";
import {
  ALL_STOP_REASONS,
  STOP_REASON_FILTER_OPTIONS,
} from "@/features/remaining-areas/lib/remaining-areas";
import {
  REMAINING_AREA_COLUMNS,
  RemainingAreasTable,
} from "@/features/remaining-areas/components/remaining-areas/remaining-areas-table";
import { SplitSheet } from "@/features/remaining-areas/components/remaining-areas/split-sheet";
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
 *
 * Chọn dòng rồi bấm "Tạo job chia nhỏ" là bước cuối cùng của quy trình đó: trước
 * khi có nút này, người dùng nhìn thấy tỉnh cần chia nhưng vẫn phải sang form
 * tạo job gõ lại từ khoá và bung 168 phường ra bằng tay.
 */

export function RemainingAreasScreen() {
  const [page, setPage] = useState(1);
  const [stopReason, setStopReason] = useState<string>(ALL_STOP_REASONS);
  /*
   * Lựa chọn GIỮ NGUYÊN khi đổi trang hoặc đổi bộ lọc, vì nó được nhận diện
   * bằng chuỗi truy vấn chứ không bằng vị trí dòng. Quy trình thật là lọc
   * "Google cắt" chọn vài tỉnh, rồi lọc "Chạm trần" chọn thêm vài cái nữa —
   * xoá sạch mỗi lần đổi bộ lọc là bắt làm hai job riêng cho cùng một việc.
   * Đổi lại, số đang chọn luôn hiện trên thanh công cụ để không ai quên.
   */
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [splitOpen, setSplitOpen] = useState(false);

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

  const handleToggle = useCallback((query: string, checked: boolean) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (checked) next.add(query);
      else next.delete(query);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(
    (checked: boolean) => {
      const trongTrang = (data?.items ?? []).map((area) => area.query);
      setSelected((previous) => {
        const next = new Set(previous);
        for (const query of trongTrang) {
          if (checked) next.add(query);
          else next.delete(query);
        }
        return next;
      });
    },
    [data],
  );

  const clearSelection = useCallback(() => setSelected(new Set()), []);

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

          {/*
            * Nhóm hành động đẩy sang phải trên màn rộng, xuống hàng riêng ở
            * điện thoại. Chỉ hiện khi đã chọn ít nhất một dòng: một nút mờ đi
            * kèm "0 địa bàn" chẳng nói được gì mà vẫn chiếm chỗ.
            */}
          {selected.size > 0 ? (
            <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
              <span className="text-sm text-muted-foreground">
                Đã chọn {formatNumber(selected.size)} địa bàn
              </span>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Bỏ chọn
              </Button>
              <Button size="sm" onClick={() => setSplitOpen(true)}>
                <ScissorsIcon />
                Tạo job chia nhỏ
              </Button>
            </div>
          ) : null}
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
              <RemainingAreasTable
                areas={data.items}
                selected={selected}
                onToggle={handleToggle}
                onToggleAll={handleToggleAll}
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

      <SplitSheet
        queries={[...selected]}
        open={splitOpen}
        onOpenChange={setSplitOpen}
        onCreated={clearSelection}
      />
    </div>
  );
}
