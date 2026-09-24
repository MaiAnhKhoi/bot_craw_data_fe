"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircleIcon, ScissorsIcon, TriangleAlertIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { ROUTES } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  SPLIT_ACTION_META,
  SPLIT_LEVEL_LABEL,
  formatDuration,
} from "@/features/remaining-areas/lib/remaining-areas";
import {
  useCreateSplitJob,
  useSplitPreview,
} from "@/features/remaining-areas/hooks/use-split-remaining";

/*
 * Panel "Tạo job chia nhỏ".
 *
 * Google chỉ trả ~110-120 kết quả mỗi truy vấn, nên địa bàn bị cắt phải được
 * chia nhỏ ra rồi quét lại. Trước panel này, người dùng nhìn thấy tỉnh nào bị
 * cắt nhưng phải tự mở form tạo job, tự gõ lại từ khoá, tự bung 168 phường của
 * tỉnh đó ra — nên trên thực tế gần như không ai làm.
 *
 * Bắt buộc phải XEM TRƯỚC rồi mới tạo: mỗi truy vấn tốn khoảng 40 giây, một
 * tỉnh Việt Nam bung ra 168 truy vấn là gần hai tiếng. Chọn nhầm bốn tỉnh là
 * đặt lệnh chạy qua đêm mà không hề biết. Bảng bên dưới nói rõ từng dòng sinh
 * ra bao nhiêu truy vấn — và dòng nào KHÔNG sinh ra gì thì vì sao.
 */

const COT = ["Địa bàn", "Sẽ làm gì", "Cấp", "Truy vấn", "Ghi chú"];

export function SplitSheet({
  queries,
  open,
  onOpenChange,
  onCreated,
}: {
  queries: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  /*
   * Trần để dạng CHUỖI chứ không phải number: ô number rỗng cho ra NaN, và một
   * NaN lọt xuống payload là backend trả 422 cho một thao tác trông hoàn toàn
   * hợp lệ. Ép kiểu đúng một lần, ngay lúc gửi.
   */
  const [maxResults, setMaxResults] = useState("300");

  const preview = useSplitPreview(queries, open);
  const createJob = useCreateSplitJob();

  const plan = preview.data;
  const tranHopLe = Number(maxResults) >= 1 && Number(maxResults) <= 500;
  const soTruyVan = plan?.total_queries ?? 0;
  const coViecDeLam = soTruyVan > 0;

  const handleCreate = () => {
    createJob.mutate(
      {
        queries,
        name: name.trim() || undefined,
        max_results_per_query: Number(maxResults),
      },
      {
        onSuccess: (job) => {
          onOpenChange(false);
          onCreated();
          setName("");
          // Đưa thẳng sang trang job: thứ người dùng muốn xem ngay sau khi đặt
          // lệnh chạy hai tiếng là nó đã thật sự bắt đầu chưa.
          router.push(ROUTES.jobDetail(job.id));
        },
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        /*
         * Ghi đè bằng ĐÚNG biến thể `data-[side=right]:` của sheet.tsx: viết
         * `sm:max-w-none` trần thì tailwind-merge không coi là xung đột nên cả
         * hai class cùng sống, và class có data-attribute thắng.
         */
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:w-[40rem] data-[side=right]:sm:max-w-none data-[side=right]:lg:w-3/5 data-[side=right]:lg:min-w-[52rem]"
      >
        <SheetHeader className="border-b">
          <SheetTitle>Tạo job chia nhỏ</SheetTitle>
          <SheetDescription>
            {formatNumber(queries.length)} địa bàn đang chọn. Xem trước sẽ sinh
            ra bao nhiêu truy vấn trước khi đặt lệnh chạy.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="split-name">Tên job</Label>
              <Input
                id="split-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Bỏ trống: đặt theo ngày giờ"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="split-max">Kết quả tối đa / truy vấn</Label>
              <Input
                id="split-max"
                type="number"
                min={1}
                max={500}
                value={maxResults}
                aria-invalid={!tranHopLe}
                onChange={(event) => setMaxResults(event.target.value)}
              />
              {/*
                * Dòng duy nhất mà các địa bàn "Chạm trần" cần tới: lần trước
                * dừng vì chính con số này, không phải vì Google.
                */}
              <p className="text-xs text-muted-foreground">
                Các địa bàn dừng vì &quot;Chạm trần&quot; chỉ cần con số này cao
                hơn lần chạy trước là đủ, không phải chia nhỏ.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border">
            {preview.isPending ? (
              <TableSkeleton columns={COT} rows={4} />
            ) : preview.isError ? (
              <ErrorState
                error={preview.error}
                onRetry={() => preview.refetch()}
              />
            ) : (
              <>
                <TongKet
                  total={soTruyVan}
                  skipped={plan?.skipped ?? 0}
                  minutes={plan?.estimated_minutes ?? 0}
                />
                <Table>
                  <TableHeader>
                    <TableRow>
                      {COT.map((cot) => (
                        <TableHead key={cot} className="first:pl-4 last:pr-4">
                          {cot}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plan?.items.map((item) => {
                      const meta = SPLIT_ACTION_META[item.hanh_dong];
                      return (
                        <TableRow key={item.query}>
                          <TableCell className="max-w-64 pl-4">
                            <span
                              className="block truncate font-medium"
                              title={item.query}
                            >
                              {item.query}
                            </span>
                            {item.tu_khoa ? (
                              <span
                                className="block truncate text-xs text-muted-foreground"
                                title={`Từ khoá "${item.tu_khoa}" · địa bàn "${item.dia_diem}"`}
                              >
                                {item.tu_khoa} · {item.dia_diem}
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn("font-normal", meta.className)}
                            >
                              {meta.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.cap ? SPLIT_LEVEL_LABEL[item.cap] : "—"}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right tabular-nums",
                              item.so_truy_van === 0 && "text-muted-foreground",
                            )}
                          >
                            {formatNumber(item.so_truy_van)}
                          </TableCell>
                          <TableCell className="max-w-72 pr-4 text-xs text-muted-foreground">
                            <span className="block wrap-anywhere whitespace-normal">
                              {item.ly_do ?? "—"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t p-4">
          <SheetClose render={<Button type="button" variant="outline" />}>
            Đóng
          </SheetClose>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={!coViecDeLam || !tranHopLe || createJob.isPending}
          >
            {createJob.isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin motion-reduce:animate-none" />
            ) : (
              <ScissorsIcon />
            )}
            Tạo job{coViecDeLam ? ` (${formatNumber(soTruyVan)} truy vấn)` : ""}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/*
 * Dòng tổng. Đây mới là thứ người dùng đọc trước khi bấm — bảng bên dưới chỉ để
 * soi lại khi con số trông lạ.
 */
function TongKet({
  total,
  skipped,
  minutes,
}: {
  total: number;
  skipped: number;
  minutes: number;
}) {
  if (total === 0) {
    return (
      <p className="flex items-start gap-2 border-b bg-muted/40 p-3 text-sm">
        <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>
          Không địa bàn nào trong danh sách này chia nhỏ hay chạy lại được. Xem
          cột ghi chú để biết vì sao.
        </span>
      </p>
    );
  }

  return (
    <p className="border-b bg-muted/40 p-3 text-sm">
      Sẽ tạo <strong className="tabular-nums">{formatNumber(total)}</strong> truy
      vấn, chạy khoảng{" "}
      <strong className="tabular-nums">{formatDuration(minutes)}</strong>.
      {skipped > 0 ? (
        <span className="text-muted-foreground">
          {" "}
          {formatNumber(skipped)} địa bàn không sinh ra truy vấn nào — xem cột
          ghi chú.
        </span>
      ) : null}
    </p>
  );
}
