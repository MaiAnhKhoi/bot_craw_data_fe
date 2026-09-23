"use client";

import { MoonIcon, ShieldAlertIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatNumber, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useWorkerStatus } from "@/features/stats/hooks/use-worker-status";
import { JOB_PHASE_LABEL } from "@/types/domain";

/*
 * Huy hiệu trạng thái worker trên header.
 *
 * Đây là thứ người vận hành liếc nhìn đầu tiên: worker còn sống không, đang làm
 * pha nào, hôm nay bị Google chặn bao nhiêu lần. Chi tiết nằm trong tooltip để
 * header không phình ra trên điện thoại.
 */
export function WorkerStatusBadge() {
  const { data, isPending, isError } = useWorkerStatus();

  if (isPending) {
    return <Skeleton className="h-7 w-32 rounded-full" />;
  }

  if (isError || !data) {
    return (
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-muted px-2.5 text-xs font-medium text-muted-foreground">
        <span className="size-2 rounded-full bg-muted-foreground/50" />
        Không rõ trạng thái
      </span>
    );
  }

  const alive = data.alive;
  const label = data.night_rest
    ? "Đang nghỉ đêm"
    : alive
      ? JOB_PHASE_LABEL[data.current_phase]
      : "Worker đã dừng";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              "inline-flex h-7 cursor-default items-center gap-1.5 rounded-full px-2.5 text-xs font-medium",
              alive
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
            )}
          />
        }
      >
        {data.night_rest ? (
          <MoonIcon className="size-3.5" />
        ) : (
          <span
            className={cn(
              "size-2 rounded-full",
              alive ? "bg-emerald-500" : "bg-red-500",
            )}
          />
        )}
        <span className="hidden sm:inline">{label}</span>
        {data.blocked_today > 0 ? (
          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
            <ShieldAlertIcon className="size-3.5" />
            {formatNumber(data.blocked_today)}
          </span>
        ) : null}
      </TooltipTrigger>
      <TooltipContent className="max-w-none">
        <div className="space-y-0.5">
          <p>{label}</p>
          <p>Nhịp hiện tại: {formatNumber(data.pace_seconds)} giây/trang</p>
          <p>Trang trong 1 giờ: {formatNumber(data.pages_last_hour)}</p>
          <p>Bị chặn hôm nay: {formatNumber(data.blocked_today)}</p>
          <p>Job đang chạy: {data.current_job_id ?? "không có"}</p>
          <p>Nhịp tim cuối: {formatRelative(data.last_heartbeat)}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
