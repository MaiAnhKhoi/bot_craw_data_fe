import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/format";
import { jobProgressPercent } from "@/features/jobs/lib/job-status";
import type { Job } from "@/features/jobs/types/job";

/*
 * Thanh tiến độ của một job + con số phía trên.
 * Dùng chung ở bảng danh sách và màn chi tiết để hai nơi không bao giờ tính
 * phần trăm theo hai cách khác nhau.
 */
export function JobProgress({ job }: { job: Job }) {
  const percent = jobProgressPercent(job);
  const counted = job.total_places > 0;

  return (
    <div className="min-w-36 space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">
          {counted
            ? `${formatNumber(job.done_places)}/${formatNumber(job.total_places)} địa điểm`
            : `${formatNumber(job.done_queries)}/${formatNumber(job.total_queries)} truy vấn`}
        </span>
        <span className="font-medium tabular-nums">{percent}%</span>
      </div>
      <Progress value={percent} />
    </div>
  );
}
